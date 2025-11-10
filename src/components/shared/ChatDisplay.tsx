
'use client';

import type { Message, User } from '@/types';
import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Paperclip, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/firebase';

interface ChatDisplayProps {
  messages: Message[];
  loading: boolean;
  selectedContact: any; 
  onSendMessage: (content: string, imageUrl?: string) => void;
  conversationId: string | null;
}

const storage = getStorage(app);

const formatTimestamp = (timestamp: any): string => {
  if (!timestamp) return '';
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (timestamp instanceof Date) {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const date = new Date(timestamp);
  if (!isNaN(date.getTime())) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return 'Invalid Date';
};

export default function ChatDisplay({
  messages,
  loading,
  selectedContact,
  onSendMessage,
  conversationId,
}: ChatDisplayProps) {
  const { user: currentUser } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (newMessage.trim() === '' && !selectedFile) return;

    let imageUrl: string | undefined;
    if (selectedFile) {
      const filePath = `chat_images/${currentUser?.uid}/${Date.now()}_${selectedFile.name}`;
      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, selectedFile);
      imageUrl = await getDownloadURL(storageRef);
    }
    
    onSendMessage(newMessage, imageUrl);
    setNewMessage('');
    setSelectedFile(null);
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-1 flex-col h-full min-h-0">
      {(conversationId || (currentUser?.role === 'caregiver' && selectedContact)) ? (
        <>
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {loading && <p>Loading messages...</p>}
              {!loading && messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex items-end gap-2",
                    msg.senderId === currentUser?.uid ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.senderId !== currentUser?.uid && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedContact?.participantProfilePicture || 'https://placehold.co/40x40.png'} alt={selectedContact?.participantName} />
                      <AvatarFallback>{selectedContact?.participantName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-xs rounded-lg p-3 text-sm md:max-w-md min-w-0 break-words",
                      msg.senderId === currentUser?.uid
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {msg.text && <p>{msg.text}</p>}
                    {msg.imageUrl && (
                        <Image 
                            src={msg.imageUrl} 
                            alt="Attached image" 
                            width={200} 
                            height={200} 
                            className="rounded-md object-cover mt-2"
                        />
                    )}
                    <p className={cn("text-xs mt-1", msg.senderId === currentUser?.uid ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
                      {formatTimestamp(msg.timestamp)}
                    </p>
                  </div>
                  {msg.senderId === currentUser?.uid && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUser?.profilePictureUrl || 'https://placehold.co/40x40.png'} alt={currentUser?.displayName} />
                      <AvatarFallback>{currentUser?.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          <footer className="border-t p-4 flex-shrink-0">
            {selectedFile && (
                <div className="mb-2 text-sm text-muted-foreground">
                    Selected file: {selectedFile.name}
                    <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)} className="ml-2">
                        x
                    </Button>
                </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1"
                disabled={!conversationId}
              />
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden"
                accept="image/*"
                disabled={!conversationId}
              />
              <Button variant="ghost" size="icon" onClick={handleAttachClick} disabled={!conversationId}>
                <Paperclip className="h-5 w-5" />
                <span className="sr-only">Attach file</span>
              </Button>
              <Button size="icon" onClick={handleSend} disabled={!conversationId}>
                <Send className="h-5 w-5" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </footer>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center p-4 text-center">
          <div className="space-y-2">
            <p className="text-muted-foreground">Select a contact to start messaging.</p>
          </div>
        </div>
      )}
    </div>
  );
}
