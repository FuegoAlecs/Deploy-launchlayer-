import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface RemixCloneDB extends DBSchema {
  files: {
    key: string;
    value: {
      path: string;
      content: string;
      type: 'file' | 'directory';
      updatedAt: number;
    };
    indexes: { 'by-path': string };
  };
}

let dbPromise: Promise<IDBPDatabase<RemixCloneDB>>;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<RemixCloneDB>('remix-clone-db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('files', { keyPath: 'path' });
        store.createIndex('by-path', 'path');

        // Add initial files
        store.put({
          path: '/contracts/Storage.sol',
          content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Storage {
    uint256 number;

    function store(uint256 num) public {
        number = num;
    }

    function retrieve() public view returns (uint256) {
        return number;
    }
}`,
          type: 'file',
          updatedAt: Date.now(),
        });

        store.put({
            path: '/contracts',
            content: '',
            type: 'directory',
            updatedAt: Date.now()
        });
      },
    });
  }
  return dbPromise;
};

export const saveFileToDB = async (path: string, content: string, type: 'file' | 'directory' = 'file') => {
  const db = await getDB();
  await db.put('files', { path, content, type, updatedAt: Date.now() });
};

export const deleteFileFromDB = async (path: string) => {
  const db = await getDB();
  await db.delete('files', path);
};

export const loadFilesFromDB = async () => {
  const db = await getDB();
  return db.getAll('files');
};
