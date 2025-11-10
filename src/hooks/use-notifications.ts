
// src/hooks/use-notifications.ts
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { Notification as NotificationType } from '@/types';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const newNotification = change.doc.data() as NotificationType;
            if (!newNotification.read) {
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                void navigator.serviceWorker?.getRegistration?.().then((registration) => {
                  if (registration) {
                    registration.showNotification('New notification', {
                      body: newNotification.content ?? 'You have a new notification.',
                    });
                  }
                });
              }
            }
          }
        });

        const newNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationType));
        setNotifications(newNotifications);
        setUnreadCount(newNotifications.filter(n => !n.read).length);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
  };

  return { notifications, unreadCount, markAsRead };
}
