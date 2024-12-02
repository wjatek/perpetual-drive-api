# Perpetual Drive API

An application that combines an interactive information board with an online storage drive for managing and sharing files.
Built with Express, Prisma, PostgreSQL, and TypeScript.

---

## Features
- **User authentication** with JWT.
- Manage **posts**, virtual **directories**, and **files**.
- Support for **nested directories** and file associations.

---

## Local Setup

### Prerequisites
1. Install [Node.js](https://nodejs.org/) (v20 or later).
2. Install [PostgreSQL](https://www.postgresql.org/).

### Steps
1. Clone the repository:
  ```
   git clone https://github.com/your-repo/perpetual-drive-api.git
   cd perpetual-drive-api
  ```
2. Install dependencies:
  ```
   npm install
  ```
3. Configure environment variables:
   Create a `.env` file in the root directory:
  ```
   PORT=3000
   DATABASE_URL=postgresql://<username>:<password>@localhost:5432/<database_name>
   JWT_SECRET=your_jwt_secret
  ```
4. Apply migrations:
  ```
   npx prisma migrate dev
  ```
5. Seed the database:
  ```
   npx ts-node prisma/seed.ts
  ```
6. Start the server:
  ```
   npm run dev
  ```
7. API is now running at http://localhost:3000.

---

## API Routes

### **Auth Routes** (`/`)
- **POST** `/register`: Register a new user.  

  **Request Body**:  
  ```
  {
    "name": "string",
    "password": "string"
  }
  ```

  **Response**:  
  - `201 Created` on success.
  - `400 Bad Request` on invalid input.

- **POST** `/login`: Login a user.  

  **Request Body**:  
  ```
  {
    "name": "string",
    "password": "string"
  }
  ```

  **Response**:  
  - `200 OK` with JWT token on success.
  - `401 Unauthorized` on failure.

---

### **User Routes** (`/users`)
- **GET** `/`: Get all users.  

  **Response**:  
  ```
  [
    {
      "id": "string",
      "name": "string"
    }
  ]
  ```

- **GET** `/:id`: Get a user by ID.  

  **Response**:  
  - `200 OK` with user details.
  - `404 Not Found` if the user does not exist.

---

### **Post Routes** (`/posts`)
- **GET** `/`: Get all posts.  

  **Response**:  
  ```
  [
    {
      "id": "string",
      "content": "string",
      "authorId": "string",
      "createdAt": "datetime"
    }
  ]
  ```

- **GET** `/:id`: Get a post by ID.  

  **Response**:  
  - `200 OK` with post details.
  - `404 Not Found` if the post does not exist.

- **POST** `/`: Create a new post.  

  **Request Body**:  
  ```
  {
    "content": "string"
  }
  ```

  **Response**:  
  - `201 Created` on success.
  - `400 Bad Request` on invalid input.

---

### **Directory Routes** (`/directories`)
- **GET** `/`: Get all directories.  
  **Response**:  
  ```
  [
    {
      "id": "string",
      "name": "string",
      "authorId": "string",
      "createdAt": "datetime",
      "parentId": "string | null"
    }
  ]
  ```

- **POST** `/`: Create a new directory.  

  **Request Body**:  
  ```
  {
    "name": "string",
    "parentId": "string | null"
  }
  ```

  **Response**:  
  - `201 Created` on success.
  - `400 Bad Request` on invalid input.

- **GET** `/:id`: Get a directory by ID.  

  **Response**:  
  - `200 OK` with directory details.
  - `404 Not Found` if the directory does not exist.

---

### **File Routes** (`/files`)
- **GET** `/`: Get all files.  
  **Response**:  
  ```
  [
    {
      "id": "string",
      "name": "string",
      "authorId": "string",
      "createdAt": "datetime",
      "directoryId": "string"
    }
  ]
  ```

- **POST** `/`: Create a new file.  

  **Request Body**:  
  ```
  {
    "name": "string",
    "directoryId": "string"
  }
  ```
  **Response**:  
  - `201 Created` on success.
  - `400 Bad Request` on invalid input.

- **GET** `/:id`: Get a file by ID.  

  **Response**:  
  - `200 OK` with file details.
  - `404 Not Found` if the file does not exist.

- **GET** `/download/:id`: Download a file by ID.  

  **Response**:  
  - `200 OK` with file details.
  - `404 Not Found` if the file does not exist.

  - The file will be streamed in the response with the appropriate headers for downloading.
  - The response headers:
  ```
  Content-Type: application/octet-stream
  Content-Length: The size of the file.
  Content-Disposition: The file will be downloaded with the specified filename.
  ```
  - The file content will be streamed as an attachment.

- **POST** `/`: Upload file.  
  ```
  {
    "directoryId": "string"
  }
  ```

  **Request file**:  
  - A file to be uploaded. The file should be included in the request as multipart/form-data.

  **Response**:  
  - `201 Created` on success.
  - `400 Bad Request` on invalid input.


---

## License
This project is licensed under the MIT License.