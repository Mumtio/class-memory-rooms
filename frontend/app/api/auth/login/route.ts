import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { login, password } = body;

    // Validate input
    if (!login || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Call Foru.ms API
    const response = await fetch(`${process.env.FORUMMS_API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.FORUMMS_API_KEY || '',
      },
      body: JSON.stringify({ login, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
      
      // Return clear error message for invalid credentials
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: 'Invalid username or password' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: errorData.error || errorData.message || 'Login failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Foru.ms returns { token: "..." }
    if (!data.token) {
      return NextResponse.json(
        { error: 'No token received from server' },
        { status: 500 }
      );
    }

    // Get user info using the token
    const userResponse = await fetch(`${process.env.FORUMMS_API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.FORUMMS_API_KEY || '',
        'Authorization': `Bearer ${data.token}`,
      },
    });

    if (!userResponse.ok) {
      // If we can't get user info, return error
      return NextResponse.json(
        { error: 'Failed to retrieve user information' },
        { status: 500 }
      );
    }

    const userData = await userResponse.json();
    
    // Return token and user data in the format our client expects
    return NextResponse.json({
      token: data.token,
      user: {
        id: userData.id,
        name: userData.displayName || userData.username,
        email: userData.email || '',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
