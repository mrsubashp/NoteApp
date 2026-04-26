import { 
  collection, 
  query, 
  where, 
  or,
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Timestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Note } from '../types';

const COLLECTION_NAME = 'notes';

export const subscribeToNotes = (userId: string, userEmail: string, callback: (notes: Note[]) => void) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    or(
      where('userId', '==', userId),
      where('sharedWith', 'array-contains', userEmail)
    ),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notes: Note[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      notes.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as Note);
    });
    callback(notes);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
  });
};

export const createNote = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...noteData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
  }
};

export const updateNote = async (noteId: string, noteData: Partial<Note>) => {
  try {
    const noteRef = doc(db, COLLECTION_NAME, noteId);
    await updateDoc(noteRef, {
      ...noteData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${noteId}`);
  }
};

export const deleteNote = async (noteId: string) => {
  try {
    const noteRef = doc(db, COLLECTION_NAME, noteId);
    await deleteDoc(noteRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${noteId}`);
  }
};

export const shareNote = async (noteId: string, email: string) => {
  try {
    const noteRef = doc(db, COLLECTION_NAME, noteId);
    await updateDoc(noteRef, {
      sharedWith: arrayUnion(email)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${noteId}`);
  }
};

export const unshareNote = async (noteId: string, email: string) => {
  try {
    const noteRef = doc(db, COLLECTION_NAME, noteId);
    await updateDoc(noteRef, {
      sharedWith: arrayRemove(email)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${noteId}`);
  }
};
