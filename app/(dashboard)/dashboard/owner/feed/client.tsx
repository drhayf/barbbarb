'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus,
  Image as ImageIcon,
  Megaphone,
  Trash2,
  Loader2,
  AlertCircle,
  Upload,
  X,
} from 'lucide-react';
import { createPost, uploadImage, deletePost } from '@/lib/actions/posts';
import type { TeamPost } from '@/lib/db/queries';
import { formatDate } from '@/lib/utils';

interface FeedPageClientProps {
  posts: TeamPost[];
}

/**
 * URL Validation Helper - Prevents crashes from invalid URLs like "tetetet"
 */
function isValidUrl(url: string | null | undefined): url is string {
  if (!url || typeof url !== 'string') return false;
  // Check if it starts with http://, https://, or /
  try {
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
  } catch {
    return false;
  }
}

export default function FeedPageClient({ posts }: FeedPageClientProps) {
  const [isPortfolioDialogOpen, setIsPortfolioDialogOpen] = useState(false);
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);
  const [announcementError, setAnnouncementError] = useState<string | null>(null);
  
  // Portfolio form state
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const [portfolioPreview, setPortfolioPreview] = useState<string | null>(null);
  const [portfolioCaption, setPortfolioCaption] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Announcement form state
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementCaption, setAnnouncementCaption] = useState('');

  const portfolioPosts = posts.filter((p) => p.type === 'portfolio');
  const announcementPosts = posts.filter((p) => p.type === 'announcement');

  // Handle file selection
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setPortfolioError('Please select a valid image (JPEG, PNG, WebP, or GIF)');
        return;
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setPortfolioError('Image size must be less than 10MB');
        return;
      }
      
      setPortfolioFile(file);
      setPortfolioError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPortfolioPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  // Clear portfolio form
  function clearPortfolioForm() {
    setPortfolioFile(null);
    setPortfolioPreview(null);
    setPortfolioCaption('');
    setUploadedImageUrl(null);
    setPortfolioError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  // Handle portfolio creation with upload
  async function handleCreatePortfolio(e: React.FormEvent) {
    e.preventDefault();
    setPortfolioError(null);
    setIsUploading(true);

    // First, upload the image if a file is selected
    if (portfolioFile) {
      // Read file as ArrayBuffer and send typed bytes to avoid File serialization truncation
      try {
        const arrayBuffer = await portfolioFile.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        console.log(`Uploading file: name=${portfolioFile.name}, size=${portfolioFile.size}, type=${portfolioFile.type}`);

        const uploadPayload = {
          name: portfolioFile.name,
          type: portfolioFile.type,
          size: portfolioFile.size,
          data,
        } as any;

        const uploadResult = await uploadImage({ file: uploadPayload });

        if (uploadResult.error) {
          setPortfolioError(uploadResult.error);
          setIsUploading(false);
          return;
        }

        if (uploadResult.imageUrl) {
          setUploadedImageUrl(uploadResult.imageUrl);
        }
      } catch (err) {
        console.error('Failed to prepare file for upload:', err);
        setPortfolioError('Failed to prepare the image for upload. Try a different file.');
        setIsUploading(false);
        return;
      }
    }

    // Then create the post
    const result = await createPost({
      type: 'portfolio',
      imageUrl: uploadedImageUrl || portfolioPreview || undefined,
      caption: portfolioCaption,
    });

    setIsUploading(false);

    if (result.success) {
      setIsPortfolioDialogOpen(false);
      clearPortfolioForm();
      window.location.reload();
    } else if (result.error) {
      setPortfolioError(result.error);
    }
  }

  // Handle announcement creation
  async function handleCreateAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    setAnnouncementError(null);
    
    const result = await createPost({
      type: 'announcement',
      title: announcementTitle,
      caption: announcementCaption,
    });
    
    if (result.success) {
      setIsAnnouncementDialogOpen(false);
      setAnnouncementTitle('');
      setAnnouncementCaption('');
      window.location.reload();
    } else if (result.error) {
      setAnnouncementError(result.error);
    }
  }

  // Handle delete
  async function handleDelete(postId: number) {
    if (confirm('Are you sure you want to delete this post?')) {
      setIsDeleting(postId);
      const result = await deletePost(postId);
      if (result.success) {
        window.location.reload();
      }
      setIsDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shop Feed</h1>
          <p className="text-muted-foreground">
            Manage your portfolio posts and announcements
          </p>
        </div>
      </div>

      <Tabs defaultValue="portfolio" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Announcements
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            {/* Portfolio Dialog */}
            <Dialog open={isPortfolioDialogOpen} onOpenChange={(open) => {
              setIsPortfolioDialogOpen(open);
              if (!open) clearPortfolioForm();
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Portfolio Post
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleCreatePortfolio}>
                  <DialogHeader>
                    <DialogTitle>New Portfolio Post</DialogTitle>
                    <DialogDescription>
                      Upload an image to showcase your work
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {/* Error Display */}
                    {portfolioError && (
                      <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-md">
                        <AlertCircle className="h-4 w-4" />
                        {portfolioError}
                      </div>
                    )}

                    {/* Image Upload */}
                    <div className="grid gap-2">
                      <Label>Image *</Label>
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                        {portfolioPreview ? (
                          <div className="relative">
                            <div className="aspect-[4/5] w-full relative rounded-lg overflow-hidden">
                              <Image
                                src={portfolioPreview}
                                alt="Preview"
                                fill
                                className="object-cover"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={clearPortfolioForm}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="py-8">
                            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500 mb-2">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-gray-400">
                              JPEG, PNG, WebP or GIF (max 10MB)
                            </p>
                            <Input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileSelect}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              Choose File
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Caption */}
                    <div className="grid gap-2">
                      <Label htmlFor="caption">Caption</Label>
                      <Input
                        id="caption"
                        placeholder="Describe your work..."
                        value={portfolioCaption}
                        onChange={(e) => setPortfolioCaption(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isUploading || !portfolioFile}>
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Uploading...
                        </>
                      ) : (
                        'Create Post'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Announcement Dialog */}
            <Dialog
              open={isAnnouncementDialogOpen}
              onOpenChange={(open) => {
                setIsAnnouncementDialogOpen(open);
                if (!open) {
                  setAnnouncementError(null);
                  setAnnouncementTitle('');
                  setAnnouncementCaption('');
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4" />
                  New Announcement
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleCreateAnnouncement}>
                  <DialogHeader>
                    <DialogTitle>New Announcement</DialogTitle>
                    <DialogDescription>
                      Share news and updates with your customers
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {/* Error Display */}
                    {announcementError && (
                      <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-md">
                        <AlertCircle className="h-4 w-4" />
                        {announcementError}
                      </div>
                    )}
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder="Holiday Hours, New Services, etc."
                        value={announcementTitle}
                        onChange={(e) =>
                          setAnnouncementTitle(e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="announcementCaption">Message</Label>
                      <Input
                        id="announcementCaption"
                        placeholder="Your announcement message..."
                        value={announcementCaption}
                        onChange={(e) =>
                          setAnnouncementCaption(e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Post Announcement</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Portfolio Tab Content */}
        <TabsContent value="portfolio" className="space-y-4">
          {portfolioPosts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ImageIcon className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-muted-foreground">No portfolio posts yet</p>
                <Button
                  variant="link"
                  onClick={() => setIsPortfolioDialogOpen(true)}
                >
                  Create your first post
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {portfolioPosts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="flex items-start gap-4 p-4">
                    {/* Safety Shield: Only render Image if URL is valid */}
                    {isValidUrl(post.imageUrl) ? (
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <Image
                          src={post.imageUrl!}
                          alt="Post"
                          fill
                          className="object-cover rounded-md"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `
                              <div style="width:80px;height:80px;background:#f3f4f6;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9ca3af;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                  <line x1="1" y1="1" x2="23" y2="23"></line>
                                  <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"></path>
                                </svg>
                              </div>
                            `;
                          }}
                        />
                      </div>
                    ) : (
                      // Fallback for invalid or missing URLs
                      <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">
                        {post.caption || 'No caption'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {post.barber?.name || 'Shop Post'} •{' '}
                        {formatDate(post.createdAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(post.id)}
                      disabled={isDeleting === post.id}
                    >
                      {isDeleting === post.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-500" />
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Announcements Tab Content */}
        <TabsContent value="announcements" className="space-y-4">
          {announcementPosts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Megaphone className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-muted-foreground">No announcements yet</p>
                <Button
                  variant="link"
                  onClick={() => setIsAnnouncementDialogOpen(true)}
                >
                  Create your first announcement
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {announcementPosts.map((post) => (
                <Card key={post.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Megaphone className="h-5 w-5 text-primary" />
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-start justify-between">
                    <p className="text-sm">{post.caption}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(post.id)}
                      disabled={isDeleting === post.id}
                    >
                      {isDeleting === post.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-500" />
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
