public with sharing class LeaveRequestController {
    @AuraEnabled(cacheable=true)
    public static List<Leave_Request__c> getMyLeaves() {
        return [SELECT Id, Name, Reason__c, Status__c, FromDate__c, ToDate__c, ManagerComment__c, User__c, OwnerId FROM Leave_Request__c WHERE User__c = :UserInfo.getUserId() ORDER BY CreatedDate DESC];
    }

        @AuraEnabled(cacheable=true)
    public static List<Leave_Request__c> getLeaveRequests() {
        return [SELECT Id, Name, Reason__c, Status__c, FromDate__c, ToDate__c, ManagerComment__c, User__c,User__r.Name, User__r.ManagerId, OwnerId FROM Leave_Request__c WHERE User__r.ManagerId = :UserInfo.getUserId() ORDER BY CreatedDate DESC];
    }
}