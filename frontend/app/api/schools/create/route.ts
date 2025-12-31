import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Create school request body:', body);
    
    const { name, description, userId } = body;

    // Validate input
    if (!name || !userId) {
      console.error('Validation failed:', { name, userId });
      return NextResponse.json(
        { error: 'School name and user ID are required' },
        { status: 400 }
      );
    }

    // Generate a join key (6 alphanumeric characters)
    const joinKey = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    console.log('Creating school thread in Foru.ms:', {
      name,
      userId,
      joinKey,
    });

    // Create a thread in Foru.ms to represent the school
    const threadResponse = await fetch(`${process.env.FORUMMS_API_URL}/thread`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.FORUMMS_API_KEY || '',
      },
      body: JSON.stringify({
        title: name,
        body: description || `Welcome to ${name}!`,
        userId: userId,
        extendedData: {
          type: 'school',
          joinKey: joinKey,
          createdAt: new Date().toISOString(),
        },
      }),
    });

    console.log('Foru.ms response status:', threadResponse.status);

    if (!threadResponse.ok) {
      const errorText = await threadResponse.text();
      console.error('Foru.ms error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || 'Failed to create school' };
      }
      
      return NextResponse.json(
        { error: errorData.error || errorData.message || 'Failed to create school in database' },
        { status: threadResponse.status }
      );
    }

    const threadData = await threadResponse.json();
    console.log('School thread created successfully:', threadData);

    // Return the school ID (thread ID) and join key
    return NextResponse.json({
      schoolId: threadData.id,
      joinKey: joinKey,
      school: {
        id: threadData.id,
        name: name,
        description: description || '',
        createdAt: threadData.createdAt,
      },
    });
  } catch (error) {
    console.error('Create school error:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the school' },
      { status: 500 }
    );
  }
}
