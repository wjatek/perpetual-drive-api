import express from 'express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const ROOT_DIRECTORY = process.env.ROOT_DIRECTORY || '.';
const PORT = process.env.PORT || '3000';;

const app = express();
app.use(cors());

// Define the User type
type User = {
  id: string;
  name: string;
};

// Define the File/Folder type
type FileSystemItem = {
  name: string;
  type: 'directory' | 'pdf' | 'image' | 'audio' | 'video' | 'text' | 'undefined';
  author: User;
  date: Date;
  size: number;
};

// Utility to determine file type based on extension
const getFileType = (ext: string): FileSystemItem['type'] => {
  const extToType: { [key: string]: FileSystemItem['type'] } = {
    // Images
    '.jpg': 'image',
    '.jpeg': 'image',
    '.png': 'image',
    '.gif': 'image',
    '.bmp': 'image',
    '.webp': 'image',
    '.svg': 'image',

    // Audio
    '.mp3': 'audio',
    '.wav': 'audio',
    '.aac': 'audio',
    '.flac': 'audio',
    '.ogg': 'audio',
    '.m4a': 'audio',

    // Video
    '.mp4': 'video',
    '.avi': 'video',
    '.mkv': 'video',
    '.mov': 'video',
    '.wmv': 'video',
    '.flv': 'video',
    '.webm': 'video',

    // Documents
    '.pdf': 'pdf',
    '.doc': 'text',
    '.docx': 'text',
    '.txt': 'text',
    '.rtf': 'text',
    '.md': 'text',
    '.xls': 'text',
    '.xlsx': 'text',
    '.ppt': 'text',
    '.pptx': 'text',

    // Archives
    '.zip': 'undefined',
    '.rar': 'undefined',
    '.7z': 'undefined',
    '.tar': 'undefined',
    '.gz': 'undefined',

    // Code/Markup Files
    '.html': 'text',
    '.css': 'text',
    '.js': 'text',
    '.ts': 'text',
    '.json': 'text',
    '.xml': 'text',
    '.yml': 'text',
    '.yaml': 'text',
    '.csv': 'text',
  };

  return extToType[ext.toLowerCase()] || 'undefined';
};

app.get('/api/files', (req, res) => {
  const directory = req.query.path
    ? path.join(ROOT_DIRECTORY, req.query.path as string) // Use subdirectory if provided
    : ROOT_DIRECTORY;

    console.log(directory);

  try {
    const files = fs.readdirSync(directory, { withFileTypes: true });

    // Mock user
    const user: User = { id: '1', name: 'Admin' };

    const items: FileSystemItem[] = files.map((file) => {
      const fullPath = path.join(directory, file.name);
      const stats = fs.statSync(fullPath);

      return {
        name: file.name,
        type: file.isDirectory() ? 'directory' : getFileType(path.extname(file.name)),
        author: user,
        date: stats.mtime,
        size: file.isDirectory() ? 0 : stats.size,
      };
    }).sort((a, b) => {
      // 1. Sort by type (directories should come first)
      if (a.type === 'directory' && b.type !== 'directory') {
        return -1; // Put 'a' (directory) before 'b' (file)
      } else if (a.type !== 'directory' && b.type === 'directory') {
        return 1; // Put 'b' (directory) before 'a' (file)
      }

      // 2. If both are the same type (either both directories or both files), compare by name
      return a.name.localeCompare(b.name);
    });

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read directory' });
  }
});

app.get('/api/files/download', (req, res) => {
  const filePath = req.query.path as string;

  // Resolve the absolute file path
  const fullPath = path.join(ROOT_DIRECTORY, filePath);

  // Check if the file exists
  if (fs.existsSync(fullPath)) {
    // Set headers for the download
    res.setHeader('Content-Disposition', `attachment; filename=${path.basename(fullPath)}`);
    res.setHeader('Content-Type', 'application/octet-stream'); // Set appropriate mime type

    // Create a read stream for the file and pipe it to the response
    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);

    fileStream.on('error', (err) => {
      console.error(err);
      res.status(500).json({ error: 'Error reading the file' });
    });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Root directory: ${ROOT_DIRECTORY}`);
});