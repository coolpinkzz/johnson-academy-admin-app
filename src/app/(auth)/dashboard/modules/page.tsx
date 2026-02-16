"use client";

import { Plus, BookOpen, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModal, DeleteConfirmation } from "@/components/modal";
import { ModuleForm } from "@/components/modal";
import { IModule } from "@/types/module";
import { createModule, deleteModule, getModules } from "@/services/modules";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useRef } from "react";

const ModulesPage = () => {
  const { openModal, closeModal } = useModal();
  const containerRef = useRef<HTMLDivElement>(null); // for infinite scroll reference
  const queryClient = useQueryClient();
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["modules"],
    queryFn: ({ pageParam = 1 }) => getModules(pageParam, 10),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const modules = data?.pages.flatMap((page) => page.results) || [];

  // implement infinite scroll using scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;

        // 1276 1914 638

        if (
          scrollTop + clientHeight >= scrollHeight - 10 &&
          hasNextPage &&
          !isFetchingNextPage
        ) {
          console.log("fetching next page");
          fetchNextPage();
        }
      }
    };

    const container = containerRef.current;
    container?.addEventListener("scroll", handleScroll);

    return () => {
      container?.removeEventListener("scroll", handleScroll);
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleCreateModule = async (moduleData: IModule) => {
    try {
      console.log("Creating module:", moduleData);
      await createModule(moduleData);

      // Invalidate and refetch modules
      queryClient.invalidateQueries({ queryKey: ["modules"] });

      // Close the modal (you might need to implement this)
      console.log("Module created successfully!");
    } catch (error) {
      console.error("Error creating module:", error);
      // You might want to show an error toast here
    }
  };

  const openCreateModuleModal = () => {
    const modalId = openModal({
      title: "Create New Module",
      content: <ModuleForm onSubmit={handleCreateModule} />,
      size: "lg",
    });
  };

  const getModuleTypeColor = (type: string) => {
    switch (type) {
      case "theory":
        return "bg-blue-100 text-blue-800";
      case "technical":
        return "bg-green-100 text-green-800";
      case "learning":
        return "bg-purple-100 text-purple-800";
      case "others":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getModuleTypeIcon = (type: string) => {
    switch (type) {
      case "theory":
        return <BookOpen size={16} />;
      case "technical":
        return <Users size={16} />;
      case "learning":
        return <Clock size={16} />;
      default:
        return <BookOpen size={16} />;
    }
  };

  const handleDeleteModule = (id: string, title: string) => {
    openModal({
      title: "Confirm Deletion",
      content: (
        <DeleteConfirmation
          itemName={title}
          onConfirm={async () => {
            await deleteModule(id);
            closeModal("");
            queryClient.invalidateQueries({ queryKey: ["modules"] });
          }}
          onCancel={() => closeModal("")}
        />
      ),
      size: "md",
      showCloseButton: false,
      closeOnOverlayClick: true,
      closeOnEscape: false,
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 p-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Modules</h1>
              <p className="text-gray-600 mt-1">
                Manage your course modules and learning materials
              </p>
            </div>
            <Button
              onClick={openCreateModuleModal}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Create Module
            </Button>
          </div>

          {/* Stats Cards */}
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Modules
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? "..." : data?.pages[0]?.totalResults || 0}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen size={20} className="text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Theory Modules
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading
                      ? "..."
                      : modules.filter((m: IModule) => m.type === "theory")
                          .length}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users size={20} className="text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Technical Modules
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading
                      ? "..."
                      : modules.filter((m: IModule) => m.type === "technical")
                          .length}
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock size={20} className="text-purple-600" />
                </div>
              </div>
            </div>
          </div> */}

          {/* Modules List */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div
              ref={containerRef}
              className="max-h-[82vh] overflow-y-auto divide-y divide-gray-200"
            >
              {isLoading ? (
                <div className="p-6 text-center text-gray-500">
                  Loading modules...
                </div>
              ) : error ? (
                <div className="p-6 text-center text-red-500">
                  Error loading modules: {error.message}
                </div>
              ) : modules.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No modules found
                </div>
              ) : (
                modules.map((module: IModule, index: number) => (
                  <div
                    key={`${module.id}-${index}`}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getModuleTypeColor(
                              module.type
                            )}`}
                          >
                            {getModuleTypeIcon(module.type)}
                            {module.type.charAt(0).toUpperCase() +
                              module.type.slice(1)}
                          </span>
                          <span className="text-sm text-gray-500">
                            Session {module.session}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {module.title}
                        </h3>
                        <p className="text-gray-600 mb-3">
                          {module.description}
                        </p>

                        {module.resources.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="font-medium">Resources:</span>
                            {module.resources.map((resource, idx) => (
                              <span
                                key={idx}
                                className="bg-gray-100 px-2 py-1 rounded text-xs"
                              >
                                {resource.file}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* <Button variant="outline" size="sm">
                          Edit
                        </Button> */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:border-red-600"
                          onClick={() =>
                            handleDeleteModule(module.id || "", module.title)
                          }
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Loading indicator for next page */}
              {isFetchingNextPage && (
                <div className="p-6 text-center text-gray-500">
                  Loading more modules...
                </div>
              )}

              {/* Load More Button as fallback */}
              {hasNextPage && !isFetchingNextPage && (
                <div className="p-6 text-center">
                  <Button
                    onClick={() => fetchNextPage()}
                    variant="outline"
                    className="mx-auto"
                  >
                    Load More Modules
                  </Button>
                </div>
              )}

              {/* End of results indicator */}
              {!hasNextPage && modules.length > 0 && (
                <div className="p-6 text-center text-gray-500 border-t">
                  You've reached the end of all modules
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ModulesPage;
