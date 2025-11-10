import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getFirestore, collection, query, orderBy, onSnapshot, doc, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';
import { useAuth } from './AuthContext';

interface Message {
  id: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
  timestamp: any; // Firestore Timestamp
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  timestamp: any; // Firestore Timestamp
  participantName?: string;
  participantProfilePicture?: string;
}

interface ChatContextType {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  selectConversation: (conversationId: string) => void;
  sendMessage: (conversationId: string, text?: string, imageUrl?: string) => Promise<void>;
  createConversation: (participantIds: string[]) => Promise<string>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const db = getFirestore(app);
const functions = getFunctions(app);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const getConversationsCallable = httpsCallable(functions, 'getConversations');
  const sendMessageCallable = httpsCallable(functions, 'sendMessage');
  const createConversationCallable = httpsCallable(functions, 'createConversation');

  // Fetch conversations
  useEffect(() => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const fetchConversations = async () => {
        try {
            // Initial load is handled by onSnapshot, so we just ensure loading is true
            if (!loading) setLoading(true);
            
            // The callable might still be useful for fetching enriched data initially
            const result = await getConversationsCallable();
            const fetchedConversations = result.data as Conversation[];
            
            // This might cause a flicker, onSnapshot should be the primary source of truth
            setConversations(fetchedConversations);
            
            if (fetchedConversations.length > 0 && !activeConversationId) {
                setActiveConversationId(fetchedConversations[0].id);
            }
        } catch (error) {
            console.error('Error fetching conversations initially:', error);
            setLoading(false); // Stop loading on error
        }
        // setLoading(false) will be handled by the snapshot listener
    };

    fetchConversations();

    const q = query(collection(db, 'conversations'), where('participants', 'array-contains', user.uid), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, 
        (snapshot) => {
            const updatedConversations = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Conversation[];

            // Here you would enrich the conversation data with participant names if needed
            // This is a simplified example; for production, you'd fetch user details
            setConversations(updatedConversations);

            if (updatedConversations.length > 0 && !activeConversationId) {
                setActiveConversationId(updatedConversations[0].id);
            }
            
            setLoading(false); // Data loaded, stop loading
        },
        (error) => {
            console.error("Error in conversation snapshot listener:", error);
            setLoading(false); // Stop loading on error
        }
    );

    return () => unsubscribe();
  }, [user]); // Removed activeConversationId from dependencies to avoid re-running on selection

  // Set active conversation details
  useEffect(() => {
    if (activeConversationId) {
      const conv = conversations.find(c => c.id === activeConversationId);
      setActiveConversation(conv || null);
    } else {
      setActiveConversation(null);
    }
  }, [activeConversationId, conversations]);

  // Fetch messages for active conversation
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    
    setLoading(true); // Start loading messages
    const messagesRef = collection(db, 'conversations', activeConversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, 
        (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data() as Omit<Message, 'id'>
            })) as Message[];
            setMessages(fetchedMessages);
            setLoading(false); // Messages loaded
        },
        (error) => {
            console.error(`Error fetching messages for conversation ${activeConversationId}:`, error);
            setLoading(false); // Stop loading on error
        }
    );

    return () => unsubscribe();
  }, [activeConversationId]);

  const selectConversation = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId);
  }, []);

  const sendMessage = useCallback(async (conversationId: string, text?: string, imageUrl?: string) => {
    if (!user || (!text && !imageUrl)) return;

    try {
      await sendMessageCallable({ conversationId, text, imageUrl });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [user, sendMessageCallable]);

  const createConversation = useCallback(async (participantIds: string[]): Promise<string> => {
    if (!user) throw new Error('User not authenticated.');
    try {
      const result = await createConversationCallable({ participantIds });
      const newConv = result.data as any;
      return newConv.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }, [user, createConversationCallable]);

  const contextValue: ChatContextType = {
    conversations,
    activeConversationId,
    activeConversation,
    messages,
    loading,
    selectConversation,
    sendMessage,
    createConversation,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
