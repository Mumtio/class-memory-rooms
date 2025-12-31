/**
 * Image Retrieval API Route
 * Fetches images stored as Base64 in Foru.ms posts
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';

// GET /api/images/[imageId] - Get an image by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const { imageId } = await params;

    // Fetch the post containing the image
    const post = await forumClient.getPost(imageId);

    if (!post || post.extendedData?.type !== 'image') {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // The body contains the data URL
    const dataUrl = post.body;

    // Check if it's a valid data URL
    if (!dataUrl.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image data' },
        { status: 500 }
      );
    }

    // Parse the data URL
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json(
        { error: 'Invalid image format' },
        { status: 500 }
      );
    }

    const contentType = matches[1];
    const base64Data = matches[2];
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': imageBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Get image error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}

// DELETE /api/images/[imageId] - Delete an image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const { imageId } = await params;

    // Verify it's an image post
    const post = await forumClient.getPost(imageId);
    if (!post || post.extendedData?.type !== 'image') {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Delete the post
    await forumClient.deletePost(imageId);

    return NextResponse.json({
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete image error:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
