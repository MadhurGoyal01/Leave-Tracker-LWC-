public class TriggerHandler {
    
    public static void handleAfterInsertUpdate(
        List<Leave_Request__c> newLeaves, 
        Map<Id, Leave_Request__c> oldMap, 
        Boolean isInsert, 
        Boolean isUpdate) {
        
        List<Messaging.SingleEmailMessage> emailsToSend = new List<Messaging.SingleEmailMessage>();
        
        // Collect all user IDs including managers
        Set<Id> userIds = new Set<Id>();
        Set<Id> managerIds = new Set<Id>();
        
        for (Leave_Request__c leave : newLeaves) {
            if (leave.User__c != null) {
                userIds.add(leave.User__c);
            }
        }
        
        // First query to get users and their manager IDs
        Map<Id, User> userMap = new Map<Id, User>(
            [SELECT Id, Name, Email, ManagerId FROM User WHERE Id IN :userIds]
        );
        
        // Collect manager IDs
        for (User user : userMap.values()) {
            if (user.ManagerId != null) {
                managerIds.add(user.ManagerId);
            }
        }
        
        // Second query to get manager details
        Map<Id, User> managerMap = new Map<Id, User>(
            [SELECT Id, Name, Email FROM User WHERE Id IN :managerIds]
        );
        
        for (Leave_Request__c leave : newLeaves) {
            try {
                Leave_Request__c oldLeave = isUpdate ? oldMap.get(leave.Id) : null;
                
                User user = userMap.get(leave.User__c);
                if (user == null) {
                    System.debug('User not found for leave request: ' + leave.Id);
                    continue;
                }
                
                User manager = user.ManagerId != null ? managerMap.get(user.ManagerId) : null;
                
                // CASE 1: New Leave Submitted — Notify Manager
                if (isInsert && manager != null && !String.isBlank(manager.Email)) {
                    Messaging.SingleEmailMessage mail = createNewLeaveNotification(leave, user, manager);
                    if (mail != null) {
                        emailsToSend.add(mail);
                    }
                }
                
                // CASE 2: Status changed to Approved or Rejected — Notify Employee
                if (isUpdate && 
                    oldLeave != null &&
                    oldLeave.Status__c != leave.Status__c &&
                    (leave.Status__c == 'Approved' || leave.Status__c == 'Rejected') &&
                    !String.isBlank(user.Email)) {
                    
                    Messaging.SingleEmailMessage mail = createStatusChangeNotification(leave, user);
                    if (mail != null) {
                        emailsToSend.add(mail);
                    }
                }
                
            } catch (Exception e) {
                System.debug('Error processing leave request ' + leave.Id + ': ' + e.getMessage());
                // Log error but continue processing other records
            }
        }
        
        // Send emails with error handling
        if (!emailsToSend.isEmpty()) {
            try {
                Messaging.SendEmailResult[] results = Messaging.sendEmail(emailsToSend);
                
                // Log any email sending failures
                for (Integer i = 0; i < results.size(); i++) {
                    if (!results[i].isSuccess()) {
                        System.debug('Email sending failed: ' + results[i].getErrors()[0].getMessage());
                    }
                }
            } catch (Exception e) {
                System.debug('Failed to send emails: ' + e.getMessage());
            }
        }
    }
    
    // Helper method to create new leave notification email
    private static Messaging.SingleEmailMessage createNewLeaveNotification(
        Leave_Request__c leave, User user, User manager) {
        
        try {
            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            mail.setToAddresses(new String[] { manager.Email });
            mail.setSubject('New Leave Request - ' + user.Name + ' (' + leave.Name + ')');
            
            String emailBody = buildNewLeaveEmailBody(leave, user, manager);
            mail.setPlainTextBody(emailBody);
            
            // Optional: Set HTML body for better formatting
            mail.setHtmlBody(buildNewLeaveHtmlBody(leave, user, manager));
            
            return mail;
            
        } catch (Exception e) {
            System.debug('Error creating new leave notification: ' + e.getMessage());
            return null;
        }
    }
    
    // Helper method to create status change notification email
    private static Messaging.SingleEmailMessage createStatusChangeNotification(
        Leave_Request__c leave, User user) {
        
        try {
            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            mail.setToAddresses(new String[] { user.Email });
            mail.setSubject('Leave Request ' + leave.Status__c + ' - ' + leave.Name);
            
            String emailBody = buildStatusChangeEmailBody(leave, user);
            mail.setPlainTextBody(emailBody);
            
            // Optional: Set HTML body for better formatting
            mail.setHtmlBody(buildStatusChangeHtmlBody(leave, user));
            
            return mail;
            
        } catch (Exception e) {
            System.debug('Error creating status change notification: ' + e.getMessage());
            return null;
        }
    }
    
    // Helper method to build new leave email body
    private static String buildNewLeaveEmailBody(Leave_Request__c leave, User user, User manager) {
        String body = 'Dear ' + manager.Name + ',\n\n';
        body += 'A new leave request has been submitted by ' + user.Name + '.\n\n';
        body += 'Details:\n';
        body += '• Request ID: ' + leave.Name + '\n';
        body += '• From Date: ' + (leave.FromDate__c != null ? leave.FromDate__c.format() : 'Not specified') + '\n';
        body += '• To Date: ' + (leave.ToDate__c != null ? leave.ToDate__c.format() : 'Not specified') + '\n';
        body += '• Reason: ' + (String.isNotBlank(leave.Reason__c) ? leave.Reason__c : 'Not specified') + '\n\n';
        body += 'Please log in to Salesforce to review and approve/reject this request.\n\n';
        body += 'Best regards,\nLeave Management System';
        
        return body;
    }
    
    // Helper method to build status change email body
    private static String buildStatusChangeEmailBody(Leave_Request__c leave, User user) {
        String body = 'Dear ' + user.Name + ',\n\n';
        body += 'Your leave request has been ' + leave.Status__c.toLowerCase() + '.\n\n';
        body += 'Details:\n';
        body += '• Request ID: ' + leave.Name + '\n';
        body += '• From Date: ' + (leave.FromDate__c != null ? leave.FromDate__c.format() : 'Not specified') + '\n';
        body += '• To Date: ' + (leave.ToDate__c != null ? leave.ToDate__c.format() : 'Not specified') + '\n';
        body += '• Status: ' + leave.Status__c + '\n';
        
        if (String.isNotBlank(leave.ManagerComment__c)) {
            body += '• Manager Comment: ' + leave.ManagerComment__c + '\n';
        }
        
        body += '\nBest regards,\nLeave Management System';
        
        return body;
    }
    
    // Helper method to build HTML email body for new leave notification
    private static String buildNewLeaveHtmlBody(Leave_Request__c leave, User user, User manager) {
        String htmlBody = '<div style="font-family: Arial, sans-serif; color: #333;">';
        htmlBody += '<h3 style="color: #0176d3;">New Leave Request Submitted</h3>';
        htmlBody += '<p>Dear ' + manager.Name + ',</p>';
        htmlBody += '<p>A new leave request has been submitted by <strong>' + user.Name + '</strong>.</p>';
        htmlBody += '<div style="background-color: #f4f6f9; padding: 15px; border-left: 4px solid #0176d3; margin: 15px 0;">';
        htmlBody += '<h4 style="margin-top: 0;">Request Details:</h4>';
        htmlBody += '<p><strong>Request ID:</strong> ' + leave.Name + '</p>';
        htmlBody += '<p><strong>From Date:</strong> ' + (leave.FromDate__c != null ? leave.FromDate__c.format() : 'Not specified') + '</p>';
        htmlBody += '<p><strong>To Date:</strong> ' + (leave.ToDate__c != null ? leave.ToDate__c.format() : 'Not specified') + '</p>';
        htmlBody += '<p><strong>Reason:</strong> ' + (String.isNotBlank(leave.Reason__c) ? leave.Reason__c : 'Not specified') + '</p>';
        htmlBody += '</div>';
        htmlBody += '<p>Please log in to Salesforce to review and approve/reject this request.</p>';
        htmlBody += '<p>Best regards,<br/>Leave Management System</p>';
        htmlBody += '</div>';
        
        return htmlBody;
    }
    
    // Helper method to build HTML email body for status change notification
    private static String buildStatusChangeHtmlBody(Leave_Request__c leave, User user) {
        String statusColor = leave.Status__c == 'Approved' ? '#28a745' : '#dc3545';
        
        String htmlBody = '<div style="font-family: Arial, sans-serif; color: #333;">';
        htmlBody += '<h3 style="color: ' + statusColor + ';">Leave Request ' + leave.Status__c + '</h3>';
        htmlBody += '<p>Dear ' + user.Name + ',</p>';
        htmlBody += '<p>Your leave request has been <strong style="color: ' + statusColor + ';">' + leave.Status__c.toLowerCase() + '</strong>.</p>';
        htmlBody += '<div style="background-color: #f4f6f9; padding: 15px; border-left: 4px solid ' + statusColor + '; margin: 15px 0;">';
        htmlBody += '<h4 style="margin-top: 0;">Request Details:</h4>';
        htmlBody += '<p><strong>Request ID:</strong> ' + leave.Name + '</p>';
        htmlBody += '<p><strong>From Date:</strong> ' + (leave.FromDate__c != null ? leave.FromDate__c.format() : 'Not specified') + '</p>';
        htmlBody += '<p><strong>To Date:</strong> ' + (leave.ToDate__c != null ? leave.ToDate__c.format() : 'Not specified') + '</p>';
        htmlBody += '<p><strong>Status:</strong> <span style="color: ' + statusColor + ';">' + leave.Status__c + '</span></p>';
        
        if (String.isNotBlank(leave.ManagerComment__c)) {
            htmlBody += '<p><strong>Manager Comment:</strong> ' + leave.ManagerComment__c + '</p>';
        }
        
        htmlBody += '</div>';
        htmlBody += '<p>Best regards,<br/>Leave Management System</p>';
        htmlBody += '</div>';
        
        return htmlBody;
    }
}