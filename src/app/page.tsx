import Image from "next/image";
import UserExample from "./components/UserExample";
import PostsExample from "./components/PostsExample";

export default function Home() {
  return (
    <div className="">
      <UserExample />
      <PostsExample />
    </div>
  );
}
