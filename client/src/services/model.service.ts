import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Model, InsertModel } from '@/types';

const MODELS_COLLECTION = 'models';

export const modelService = {
  // Create a new model record
  async createModel(data: InsertModel): Promise<Model> {
    const modelData = {
      ...data,
      uploadedAt: Date.now(),
    };

    const docRef = await addDoc(collection(db, MODELS_COLLECTION), modelData);
    
    return {
      id: docRef.id,
      ...modelData,
    };
  },

  // Get model by ID
  async getModel(id: string): Promise<Model | null> {
    const docRef = doc(db, MODELS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Model;
  },

  // Get all models for a user
  async getUserModels(userId: string): Promise<Model[]> {
    const q = query(
      collection(db, MODELS_COLLECTION),
      where('userId', '==', userId),
      orderBy('uploadedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Model));
  },

  // Get recent models for a user
  async getRecentModels(userId: string, limitCount: number = 6): Promise<Model[]> {
    const q = query(
      collection(db, MODELS_COLLECTION),
      where('userId', '==', userId),
      orderBy('uploadedAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Model));
  },

  // Update model
  async updateModel(id: string, data: Partial<Model>): Promise<void> {
    const docRef = doc(db, MODELS_COLLECTION, id);
    await updateDoc(docRef, data);
  },

  // Delete model
  async deleteModel(id: string): Promise<void> {
    const docRef = doc(db, MODELS_COLLECTION, id);
    await deleteDoc(docRef);
  },

  // Count user models
  async countUserModels(userId: string): Promise<number> {
    const models = await this.getUserModels(userId);
    return models.length;
  },
};
