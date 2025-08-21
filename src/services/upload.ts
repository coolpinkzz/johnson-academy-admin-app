import AuthService from "./auth";
import { client } from "./api-client";

// response type
export type UploadResponse = {
  data: {
    fileId: string;
    fileName: string;
    filePath: string;
    fileType: string;
    height: number;
    size: number;
    thumbnailUrl: string;
    url: string;
    width: number;
  };
};

// fileId
// :
// "689f822d5c7cd75eb892ddf0"
// fileName
// :
// "1755284012203_image_Caw9jz8aah.jpg"
// filePath
// :
// "/johnson-academy/students/1755284012203_image_Caw9jz8aah.jpg"
// fileType
// :
// "image"
// height
// :
// 707
// size
// :
// 64118
// thumbnailUrl
// :
// "https://ik.imagekit.io/slipnscore/tr:n-ik_ml_thumbnail/johnson-academy/students/1755284012203_image_Caw9jz8aah.jpg"
// url
// :
// "https://ik.imagekit.io/slipnscore/johnson-academy/students/1755284012203_image_Caw9jz8aah.jpg"
// width
// :
// 1131

//export the function
const uploadProfilePicture = async (
  file: File,
  folder: string,
  tags: string
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  formData.append("tags", tags);

  const response = await client("/upload", {
    method: "POST",
    data: formData,
    isFormData: true,
    headers: {
      Authorization: `Bearer ${AuthService.getAccessToken()}`,
      "Content-Type": "multipart/form-data",
    },
  });

  return response as unknown as UploadResponse;
};

export { uploadProfilePicture };
