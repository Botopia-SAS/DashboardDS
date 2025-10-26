import sendEmail from './sendEmail';

// Store active SSE connections
const connections = new Set<ReadableStreamDefaultController>();

// Function to add a connection
export function addConnection(controller: ReadableStreamDefaultController) {
  connections.add(controller);

}

// Function to remove a connection
export function removeConnection(controller: ReadableStreamDefaultController) {
  connections.delete(controller);

}

// Function to send email notification
async function sendEmailNotification(type: string, data: any) {
  const adminEmail = process.env.NOTIFICATION_EMAIL;

  if (!adminEmail) {

    return;
  }

  try {
    // Format notification message based on type
    let subject = '🔔 New Notification - Dashboard';
    let htmlBody = '';

    switch (type) {
      case 'new_request':
        subject = '🆕 New Request Received';
        htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">New Request Notification</h2>
            <p>A new request has been received in the dashboard.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Type:</strong> ${data.requestType || 'Unknown'}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Details:</strong> ${JSON.stringify(data, null, 2)}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Check the dashboard for more details.</p>
          </div>
        `;
        break;

      case 'ticket':
      case 'driving-test':
      case 'driving-lessons':
        subject = `🎫 New ${type.replace('-', ' ')} notification`;
        htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">New ${type.replace('-', ' ').toUpperCase()} Notification</h2>
            <p>A new notification has been received.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Type:</strong> ${type}</p>
              <p><strong>Action:</strong> ${data.action || 'Unknown'}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Check the dashboard for more details.</p>
          </div>
        `;
        break;

      default:
        htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">New Notification</h2>
            <p>A new notification has been received in the dashboard.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Type:</strong> ${type}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Data:</strong> ${JSON.stringify(data, null, 2)}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Check the dashboard for more details.</p>
          </div>
        `;
    }

    await sendEmail(
      [adminEmail],
      subject,
      `New notification: ${type}`,
      htmlBody
    );


  } catch (error) {
    console.error('❌ Error sending email notification:', error);
  }
}

// Function to broadcast to all connected clients
export async function broadcastNotification(type: string, data: any) {
  // Send email notification (async, no await to not block SSE)
  sendEmailNotification(type, data).catch(err =>
    console.error('Failed to send email notification:', err)
  );

  if (connections.size === 0) {

    return;
  }

  const message = `data: ${JSON.stringify({
    type,
    data,
    timestamp: new Date().toISOString()
  })}\n\n`;

  // Track connections to remove
  const connectionsToRemove: ReadableStreamDefaultController[] = [];

  // Send to all connected clients
  connections.forEach(controller => {
    try {
      // Check if the controller is still usable
      if (controller.desiredSize !== null && controller.desiredSize >= 0) {
        controller.enqueue(message);
      } else {
        // Controller is closed, mark for removal
        connectionsToRemove.push(controller);
      }
    } catch {
      // Si hay cualquier error, marcar la conexión para eliminación
      connectionsToRemove.push(controller);
    }
  });

  // Remove dead connections
  connectionsToRemove.forEach(controller => {
    connections.delete(controller);
  });

  if (connectionsToRemove.length > 0) {

  }


}
