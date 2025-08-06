public with sharing class LeaveRequestController {
    @AuraEnabled(cacheable=true)
    public static List<Leave_Request__c> getMyLeaves() {
        return [SELECT Id, Name, Reason__c, Status__c, FromDate__c, ToDate__c, ManagerComment__c, User__c, OwnerId FROM Leave_Request__c WHERE User__c = :UserInfo.getUserId() ORDER BY CreatedDate DESC];
    }

@AuraEnabled
public static List<Leave_Request__c> getFilteredLeaveRequestsPaginated(String searchKey, String status, String fromDateStr, String toDateStr, Integer offsetSize, Integer limitSize) {
    String managerId = UserInfo.getUserId();

    Date fromDate;
    Date toDate;

    // Safely parse the date strings
    if (!String.isBlank(fromDateStr)) {
        try {
            fromDate = Date.valueOf(fromDateStr);
        } catch (Exception e) {
            // ignore or handle invalid date format
        }
    }

    if (!String.isBlank(toDateStr)) {
        try {
            toDate = Date.valueOf(toDateStr);
        } catch (Exception e) {
            // ignore or handle invalid date format
        }
    }

    String baseQuery = 'SELECT Id, Name, Reason__c, Status__c, FromDate__c, ToDate__c, ManagerComment__c, User__c, User__r.Name ' +
                       'FROM Leave_Request__c WHERE User__r.ManagerId = :managerId';

    if (!String.isBlank(searchKey)) {
        baseQuery += ' AND User__r.Name LIKE \'%' + String.escapeSingleQuotes(searchKey) + '%\'';
    }

    if (!String.isBlank(status)) {
        baseQuery += ' AND Status__c = :status';
    }

    if (fromDate != null && toDate != null) {
        baseQuery += ' AND FromDate__c >= :fromDate AND ToDate__c <= :toDate';
    }

    baseQuery += ' ORDER BY CreatedDate DESC LIMIT :limitSize OFFSET :offsetSize';

    return Database.query(baseQuery);
}


}