import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3000;

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

// API endpoint to serve files and folders
app.get('/api/files', (req, res) => {
  const directory = req.query.dir as string || '.'; // Default to current directory

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
        author: user, // Mock user as the author
        date: stats.mtime, // Last modification date
        size: file.isDirectory() ? 0 : stats.size, // Directories have size 0
      };
    });

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read directory' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});