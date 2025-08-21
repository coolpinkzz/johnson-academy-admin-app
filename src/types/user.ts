// {
//     "results": [
//         {
//             "name": "John Doe",
//             "email": "john.doe@example.com",
//             "role": "student",
//             "isEmailVerified": false,
//             "subjects": [],
//             "isActive": true,
//             "classes": [
//                 "687387f6e0b6e94e85464b0e"
//             ],
//             "courses": [
//                 "6873723c32a37cbadbaae98a"
//             ],
//             "progress": [
//                 "689c9d74d66fe6b9f466d642"
//             ],
//             "id": "6873618b960cf10f278aa93a"
//         },
//         {
//             "name": "Pratik Yadav",
//             "email": "pratik@example.com",
//             "role": "student",
//             "isEmailVerified": false,
//             "subjects": [],
//             "isActive": true,
//             "classes": [
//                 "687387f6e0b6e94e85464b0e"
//             ],
//             "courses": [
//                 "6873723c32a37cbadbaae98a"
//             ],
//             "progress": [
//                 "6873d6960c171a4a741c7467"
//             ],
//             "id": "68738dd74480821c5b34e7b9"
//         },
//         {
//             "name": "Alina",
//             "email": "alina@gmail.com",
//             "role": "student",
//             "isEmailVerified": false,
//             "subjects": [],
//             "isActive": true,
//             "classes": [
//                 "687387f6e0b6e94e85464b0e"
//             ],
//             "courses": [
//                 "6873723c32a37cbadbaae98a"
//             ],
//             "progress": [
//                 "689ce37ea3051ab0cd4260e3"
//             ],
//             "id": "68974e6e76e208e7550b6e91"
//         },
//         {
//             "name": "Pratik Yadav",
//             "email": "masterpratikyadav@gmail.com",
//             "role": "student",
//             "isEmailVerified": false,
//             "subjects": [],
//             "isActive": true,
//             "profilePicture": "https://ik.imagekit.io/slipnscore/johnson-academy/students/1755284520314_image_SCxLwm7NO.jpg",
//             "phoneNumber": "9632967897",
//             "classes": [],
//             "courses": [],
//             "progress": [],
//             "id": "689f84407896314fc861df79"
//         }
//     ],
//     "page": 1,
//     "limit": 10,
//     "totalPages": 1,
//     "totalResults": 4
// }

// user response

export interface UserResponse {
  results: User[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  subjects: string[];
  isActive: boolean;
  classes: string[];
  courses: string[];
  progress: string[];
}
