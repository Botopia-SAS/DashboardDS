import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/lib/modals/user.modal";
import { connectToDB } from "@/lib/mongoDB";

export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    // Check what users exist in the database
    const allUsers = await User.find({}, { email: 1, firstName: 1, lastName: 1, role: 1 });
    console.log("[INIT-ADMIN] Current users in database:", allUsers);

    if (allUsers.length > 0) {
      return NextResponse.json(
        { 
          message: "Users already exist in database",
          existingUsers: allUsers.map(user => ({
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role
          }))
        },
        { status: 200 }
      );
    }

    // Only create admin if NO users exist
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const adminUser = await User.create({
      email: "admin@drivingschool.com",
      firstName: "Admin",
      lastName: "User",
      password: hashedPassword,
      role: "admin",
      ssnLast4: "0000",
      birthDate: "1990-01-01",
      streetAddress: "123 Admin St",
      apartmentNumber: "1",
      city: "Admin City",
      state: "Admin State",
      zipCode: "12345",
      phoneNumber: "555-0123",
      sex: "Other",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("[INIT-ADMIN] Admin user created:", {
      email: adminUser.email,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName
    });

    return NextResponse.json(
      {
        message: "Admin user created successfully! You can now login.",
        user: {
          email: adminUser.email,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          role: adminUser.role
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error with admin user:", error);
    return NextResponse.json(
      { message: "Error managing admin user" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    
    // Check what users exist in the database
    const allUsers = await User.find({}, { email: 1, firstName: 1, lastName: 1, role: 1 });
    const userCount = await User.countDocuments();

    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Database Users</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          .button { background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
          .result { margin-top: 20px; padding: 15px; border-radius: 5px; }
          .success { background: #d1fae5; color: #065f46; }
          .error { background: #fee2e2; color: #991b1b; }
          .info { background: #e0f2fe; color: #0277bd; }
          .user-list { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <h1>Database Users Management</h1>
        <p>Total users in database: <strong>${userCount}</strong></p>
        
        ${userCount > 0 ? `
          <div class="user-list">
            <h3>Existing Users:</h3>
            ${allUsers.map(user => `
              <div style="padding: 8px; border-bottom: 1px solid #ddd;">
                <strong>Email:</strong> ${user.email}<br>
                <strong>Name:</strong> ${user.firstName} ${user.lastName}<br>
                <strong>Role:</strong> ${user.role || 'user'}
              </div>
            `).join('')}
          </div>
          <div class="result info">
            <p>Users already exist. Use the credentials from your MongoDB database to login.</p>
            <p><a href="/sign-in">Go to Login Page</a></p>
          </div>
        ` : `
          <button class="button" onclick="createAdmin()">Create Admin User</button>
          <div id="result"></div>
        `}
        
        <script>
          async function createAdmin() {
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = 'Creating admin user...';
            
            try {
              const response = await fetch('/api/init-admin', { method: 'POST' });
              const data = await response.json();
              
              if (response.ok) {
                resultDiv.className = 'result success';
                resultDiv.innerHTML = \`
                  <h3>\${data.message}</h3>
                  <p><strong>Email:</strong> \${data.user.email}</p>
                  <p><strong>Name:</strong> \${data.user.firstName} \${data.user.lastName}</p>
                  <p><strong>Password:</strong> admin123 (default)</p>
                  <p><a href="/sign-in">Go to Login Page</a></p>
                \`;
              } else {
                resultDiv.className = 'result error';
                resultDiv.innerHTML = \`<p>Error: \${data.message}</p>\`;
              }
            } catch (error) {
              resultDiv.className = 'result error';
              resultDiv.innerHTML = \`<p>Error: Failed to create admin user</p>\`;
            }
          }
        </script>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    return new Response(`
      <html>
        <body>
          <h1>Database Connection Error</h1>
          <p>Could not connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}</p>
          <p>Please check your MONGODB_URI in .env.local</p>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }
} 