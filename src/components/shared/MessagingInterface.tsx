
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CornerDownLeft, Loader2, Plus, Send, Image, MessageSquarePlus } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/firebase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types';

const functions = getFunctions(app);
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

export default function MessagingInterface() {
  const { user: currentUser } = useAuth();
  const {
    conversations,
    activeConversationId,
    activeConversation,
    selectConversation,
    messages,
    sendMessage,
    createConversation,
    loading: chatLoading,
  } = useChat();

  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [isMobileContactSheetOpen, setIsMobileContactSheetOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [newChatSearchTerm, setNewChatSearchTerm] = useState('');
  const [noAdminChatPossible, setNoAdminChatPossible] = useState(false);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, activeConversationId]);

  const handleSendMessage = useCallback(async () => {
    if ((!newMessage.trim() && !selectedImage) || !activeConversationId || !currentUser) return;

    setSendingMessage(true);
    let imageUrl: string | undefined;

    try {
      if (selectedImage) {
        const imagePath = `chat_images/${activeConversationId}/${Date.now()}_${selectedImage.name}`;
        const imageRef = ref(storage, imagePath);
        await uploadBytes(imageRef, selectedImage);
        imageUrl = await getDownloadURL(imageRef);
      }

      await sendMessage(activeConversationId, newMessage, imageUrl);
      setNewMessage('');
      setSelectedImage(null); // Clear selected image after sending
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message.',
        variant: 'destructive',
      });
    } finally {
      setSendingMessage(false);
    }
  }, [newMessage, selectedImage, activeConversationId, currentUser, sendMessage, toast]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedImage(event.target.files[0]);
    }
  };

  // --- New Chat Logic ---
  const getAllUsersCallable = httpsCallable(functions, 'getAllUsers');
  const createConversationCallable = httpsCallable(functions, 'createConversation');

  const fetchAllUsers = useCallback(async () => {
    try {
      const result = await getAllUsersCallable();
      setAllUsers((result.data as any).filter((u: User) => u.uid !== currentUser?.uid));
    } catch (error) {
      console.error('Error fetching all users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users for new chat.',
        variant: 'destructive',
      });
    }
  }, [currentUser, getAllUsersCallable, toast]);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  const handleStartNewChat = async (selectedUserIds: string[]) => {
    if (!currentUser || selectedUserIds.length === 0) return;

    try {
      const result = await createConversationCallable({ participantIds: selectedUserIds });
      const newConv = result.data as any;
      selectConversation(newConv.id);
      setIsNewChatDialogOpen(false);
      setIsMobileContactSheetOpen(false); // Close sheet after starting new chat
      toast({ title: 'Success', description: newConv.existed ? 'Conversation already exists.' : 'New conversation started!' });
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start new conversation.',
        variant: 'destructive',
      });
    }
  };

  const activeParticipant = activeConversation
    ? allUsers.find(u => activeConversation.participants.includes(u.uid) && u.uid !== currentUser?.uid)
    : null;

  const filteredContacts = allUsers.filter(user =>
    user.displayName?.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(contactSearchTerm.toLowerCase())
  );

  const filteredNewChatUsers = allUsers.filter(user =>
    user.displayName?.toLowerCase().includes(newChatSearchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(newChatSearchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar for Contacts - Desktop */}
      <Card className="hidden md:flex flex-col w-1/4 h-full border-r">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Conversations
            <Dialog open={isNewChatDialogOpen} onOpenChange={setIsNewChatDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MessageSquarePlus className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Chat</DialogTitle>
                  <DialogDescription>Select users to start a new conversation.</DialogDescription>
                </DialogHeader>
                <Input
                  placeholder="Search users..."
                  value={newChatSearchTerm}
                  onChange={(e) => setNewChatSearchTerm(e.target.value)}
                  className="mb-4"
                />
                <ScrollArea className="h-64 pr-4">
                  {filteredNewChatUsers.length === 0 && <p className="text-muted-foreground text-center">No users found.</p>}
                  <div className="space-y-2">
                    {filteredNewChatUsers.map((user) => (
                      <div key={user.uid} className="flex items-center space-x-2">
                        <Checkbox
                          id={`user-${user.uid}`}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleStartNewChat([user.uid]);
                            }
                          }}
                        />
                        <Label htmlFor={`user-${user.uid}`} className="flex items-center space-x-2 cursor-pointer">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.profilePictureUrl} />
                            <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{user.displayName || user.email}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <Input
            placeholder="Search contacts..."
            value={contactSearchTerm}
            onChange={(e) => setContactSearchTerm(e.target.value)}
          />
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full">
            {chatLoading && conversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No conversations yet.</div>
            ) : (
              conversations
                .filter(conv =>
                  conv.participantName?.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
                  conv.lastMessage?.toLowerCase().includes(contactSearchTerm.toLowerCase())
                )
                .map((conv) => (
                  <div
                    key={conv.id}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted ${
                      activeConversationId === conv.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => selectConversation(conv.id)}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={conv.participantProfilePicture} />
                      <AvatarFallback>{conv.participantName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1">
                      <p className="font-medium leading-none">{conv.participantName}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {conv.lastMessage}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 h-full">
        <Sheet open={isMobileContactSheetOpen} onOpenChange={setIsMobileContactSheetOpen}>
          {/* The SheetContent is now a sibling to the main chat view, not a parent */}
          <SheetContent side="left" className="flex flex-col w-3/4">
            <SheetHeader>
              <SheetTitle>Conversations</SheetTitle>
              <SheetDescription>Select a contact to chat with.</SheetDescription>
            </SheetHeader>
            <Input
              placeholder="Search contacts..."
              value={contactSearchTerm}
              onChange={(e) => setContactSearchTerm(e.target.value)}
              className="mb-4"
            />
            <ScrollArea className="flex-1 overflow-auto -mx-6 px-6">
              {chatLoading && conversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No conversations yet.</div>
              ) : (
                conversations
                  .filter(conv =>
                    conv.participantName?.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
                    conv.lastMessage?.toLowerCase().includes(contactSearchTerm.toLowerCase())
                  )
                  .map((conv) => (
                    <div
                      key={conv.id}
                      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted ${
                        activeConversationId === conv.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => {
                        selectConversation(conv.id);
                        setIsMobileContactSheetOpen(false);
                      }}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={conv.participantProfilePicture} />
                        <AvatarFallback>{conv.participantName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="grid gap-1">
                        <p className="font-medium leading-none">{conv.participantName}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {conv.lastMessage}
                        </p>
                      </div>
                    </div>
                  ))
              )}
            </ScrollArea>
            <Separator className="my-4" />
            <Dialog open={isNewChatDialogOpen} onOpenChange={setIsNewChatDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <MessageSquarePlus className="mr-2 h-4 w-4" /> New Chat
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Chat</DialogTitle>
                  <DialogDescription>Select users to start a new conversation.</DialogDescription>
                </DialogHeader>
                <Input
                  placeholder="Search users..."
                  value={newChatSearchTerm}
                  onChange={(e) => setNewChatSearchTerm(e.target.value)}
                  className="mb-4"
                />
                <ScrollArea className="h-64 pr-4">
                  {filteredNewChatUsers.length === 0 && <p className="text-muted-foreground text-center">No users found.</p>}
                  <div className="space-y-2">
                    {filteredNewChatUsers.map((user) => (
                      <div key={user.uid} className="flex items-center space-x-2">
                        <Checkbox
                          id={`new-chat-user-${user.uid}`}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleStartNewChat([user.uid]);
                            }
                          }}
                        />
                        <Label htmlFor={`new-chat-user-${user.uid}`} className="flex items-center space-x-2 cursor-pointer">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.profilePictureUrl} />
                            <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{user.displayName || user.email}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </SheetContent>

          {activeConversation && activeParticipant ? (
            <Card className="flex flex-col h-full rounded-none border-none">
              <CardHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-3">
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <MessageSquarePlus className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>

                  <Avatar className="h-9 w-9">
                    <AvatarImage src={activeParticipant.profilePictureUrl} />
                    <AvatarFallback>{activeParticipant.displayName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1">
                    <p className="font-medium leading-none">{activeParticipant.displayName}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {activeParticipant.role}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-4">
                <ScrollArea className="h-full" ref={scrollAreaRef}>
                  <div className="space-y-4">
                    {chatLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-muted-foreground">Start a conversation!</div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex gap-2 ${
                            msg.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {msg.senderId !== currentUser?.uid && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={activeParticipant.profilePictureUrl} />
                              <AvatarFallback>{activeParticipant.displayName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`flex max-w-[70%] flex-col gap-1 rounded-lg p-3 ${
                              msg.senderId === currentUser?.uid
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {msg.text && <p className="text-sm">{msg.text}</p>}
                            {msg.imageUrl && (
                              <img src={msg.imageUrl} alt="Message attachment" className="max-w-xs rounded-md" />
                            )}
                            <span
                              className={`text-xs ${
                                msg.senderId === currentUser?.uid ? 'text-primary-foreground/70' : 'text-muted-foreground'
                              }`}
                            >
                              {formatTimestamp(msg.timestamp)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="flex items-center p-4 border-t">
                {selectedImage && (
                  <div className="relative mr-2">
                    <img src={URL.createObjectURL(selectedImage)} alt="Preview" className="h-16 w-16 object-cover rounded-md" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                      onClick={() => setSelectedImage(null)}
                    >
                      X
                    </Button>
                  </div>
                )}
                <div className="relative flex-1">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="min-h-[40px] pr-12 resize-none"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={sendingMessage}
                  />
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-9 top-1/2 -translate-y-1/2"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={sendingMessage}
                  >
                    <Image className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={handleSendMessage}
                    disabled={sendingMessage || (!newMessage.trim() && !selectedImage)}
                  >
                    {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center text-muted-foreground p-4">
              <MessageSquarePlus className="h-24 w-24 mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Select a Conversation</h2>
              <p className="text-lg">Choose an existing chat or start a new one.</p>
              <SheetTrigger asChild>
                <Button className="mt-6 md:hidden">
                  <MessageSquarePlus className="mr-2 h-4 w-4" /> View Contacts
                </Button>
              </SheetTrigger>
              <Dialog open={isNewChatDialogOpen} onOpenChange={setIsNewChatDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="mt-4 hidden md:flex">
                    <MessageSquarePlus className="mr-2 h-4 w-4" /> Start New Chat
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Start New Chat</DialogTitle>
                    <DialogDescription>Select users to start a new conversation.</DialogDescription>
                  </DialogHeader>
                  <Input
                    placeholder="Search users..."
                    value={newChatSearchTerm}
                    onChange={(e) => setNewChatSearchTerm(e.target.value)}
                    className="mb-4"
                  />
                  <ScrollArea className="h-64 pr-4">
                    {filteredNewChatUsers.length === 0 && <p className="text-muted-foreground text-center">No users found.</p>}
                    <div className="space-y-2">
                      {filteredNewChatUsers.map((user) => (
                        <div key={user.uid} className="flex items-center space-x-2">
                          <Checkbox
                            id={`new-chat-user-${user.uid}`}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                handleStartNewChat([user.uid]);
                              }
                            }}
                          />
                          <Label htmlFor={`new-chat-user-${user.uid}`} className="flex items-center space-x-2 cursor-pointer">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.profilePictureUrl} />
                              <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{user.displayName || user.email}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </Sheet>
      </div>
    </div>
  );
}
