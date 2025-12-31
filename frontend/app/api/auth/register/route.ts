import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { login, password, email } = body;

    // Validate input
    if (!login || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Call Foru.ms API - uses 'username' not 'login'
    const response = await fetch(`${process.env.FORUMMS_API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.FORUMMS_API_KEY || '',
      },
      body: JSON.stringify({ 
        username: login,  // Foru.ms uses 'username' for registration
        password, 
        email: email || `${login}@example.com`,  // Provide default email if not given
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Registration failed' }));
      return NextResponse.json(
        { error: errorData.error || errorData.message || 'Registration failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Foru.ms returns { user: {...}, token: "..." }
    if (!data.token || !data.user) {
      return NextResponse.json(
        { error: 'Invalid response from server' },
        { status: 500 }
      );
    }

    // Return token and user data in the format our client expects
    return NextResponse.json({
      token: data.token,
      user: {
        id: data.user.id,
        name: data.user.displayName || data.user.username,
        email: data.user.email || email || `${login}@example.com`,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
