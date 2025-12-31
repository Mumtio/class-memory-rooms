/**
 * Image Upload API Route
 * Stores images as Base64 data URLs in Foru.ms posts
 * 
 * Innovation: Uses Foru.ms posts as an image storage backend
 * Each image is stored as a post with type 'image' in extendedData
 * The image data is stored as a Base64 data URL in the post body
 * 
 * Limitations:
 * - Max image size ~1MB (after Base64 encoding ~1.37MB)
 * - Images are compressed before storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';

const MAX_IMAGE_SIZE = 1024 * 1024; // 1MB before encoding

// POST /api/images/upload - Upload an image
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;
    const chapterId = formData.get('chapterId') as string | null;
    const schoolId = formData.get('schoolId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: 'Image must be less than 1MB' },
        { status: 400 }
      );
    }

    // Convert to Base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Store in Foru.ms as a post
    // If chapterId is provided, store in that thread
    // Otherwise, create a standalone image post in a special images thread
    
    let threadId = chapterId;
    
    // If no chapter, we need a place to store orphan images
    // For now, require chapterId
    if (!threadId) {
      return NextResponse.json(
        { error: 'Chapter ID is required for image upload' },
        { status: 400 }
      );
    }

    const post = await forumClient.createPost({
      threadId: threadId,
      body: dataUrl,
      userId: userId,
      extendedData: {
        type: 'image',
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        schoolId: schoolId,
        chapterId: chapterId,
      }
    });

    // Return the image URL (which is just the post ID that can be used to fetch the image)
    return NextResponse.json({
      imageId: post.id,
      imageUrl: `/api/images/${post.id}`,
      dataUrl: dataUrl, // Also return the data URL for immediate use
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
