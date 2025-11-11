import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SharedLink, InsertSharedLink, QROptions } from '@/types';

const SHARES_COLLECTION = 'shared_links';

export const shareService = {
  // Create a new shared link
  async createShareLink(data: InsertSharedLink): Promise<SharedLink> {
    const shareData = {
      ...data,
      createdAt: Date.now(),
      views: 0,
      scans: 0,
    };

    const docRef = await addDoc(collection(db, SHARES_COLLECTION), shareData);
    
    return {
      id: docRef.id,
      ...shareData,
    };
  },

  // Get shared link by ID
  async getShareLink(id: string): Promise<SharedLink | null> {
    const docRef = doc(db, SHARES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as SharedLink;
  },

  // Get all shared links for a user
  async getUserShareLinks(userId: string): Promise<SharedLink[]> {
    const q = query(
      collection(db, SHARES_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as SharedLink));
  },

  // Get recent shared links for a user
  async getRecentShareLinks(userId: string, limitCount: number = 3): Promise<SharedLink[]> {
    const q = query(
      collection(db, SHARES_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as SharedLink));
  },

  // Update shared link
  async updateShareLink(id: string, data: Partial<SharedLink>): Promise<void> {
    const docRef = doc(db, SHARES_COLLECTION, id);
    await updateDoc(docRef, data);
  },

  // Revoke a shared link
  async revokeShareLink(id: string): Promise<void> {
    await this.updateShareLink(id, { isActive: false });
  },

  // Extend expiration
  async extendExpiration(id: string, days: number = 30): Promise<void> {
    const newExpiration = Date.now() + (days * 24 * 60 * 60 * 1000);
    await this.updateShareLink(id, { expiresAt: newExpiration });
  },

  // Increment view count
  async incrementViews(id: string): Promise<void> {
    const link = await this.getShareLink(id);
    if (link) {
      await this.updateShareLink(id, { views: link.views + 1 });
    }
  },

  // Increment scan count
  async incrementScans(id: string): Promise<void> {
    const link = await this.getShareLink(id);
    if (link) {
      await this.updateShareLink(id, { scans: link.scans + 1 });
    }
  },

  // Count active links for user
  async countActiveLinks(userId: string): Promise<number> {
    const links = await this.getUserShareLinks(userId);
    const now = Date.now();
    return links.filter(link => link.isActive && link.expiresAt > now).length;
  },

  // Build share URL
  buildShareUrl(linkId: string): string {
    return `${window.location.origin}/ar?id=${linkId}`;
  },
};
