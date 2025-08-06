trigger LeaveRequestTrigger on Leave_Request__c (after insert, after update) {
    
    
    // Delegate to handler class
    TriggerHandler.handleAfterInsertUpdate(Trigger.new, Trigger.oldMap, Trigger.isInsert, Trigger.isUpdate);
}