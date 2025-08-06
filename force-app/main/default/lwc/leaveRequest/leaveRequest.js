import { LightningElement, wire, api } from "lwc";
import getLeaveRequests from "@salesforce/apex/LeaveRequestController.getLeaveRequests";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

import { refreshApex } from "@salesforce/apex";

const columns = [
  {
    label: "Request Id",
    fieldName: "Name",
    cellAttributes: { class: { fieldName: "cellColor" } }
  },
    {
    label: "User",
    fieldName: "username",
    cellAttributes: { class: { fieldName: "cellColor" } }
  },
  {
    label: "From Date",
    fieldName: "FromDate__c",
    type: "date",
    cellAttributes: { class: { fieldName: "cellColor" } }
  },
  {
    label: "To Date",
    fieldName: "ToDate__c",
    type: "date",
    cellAttributes: { class: { fieldName: "cellColor" } }
  },
  {
    label: "Reason",
    fieldName: "Reason__c",
    cellAttributes: { class: { fieldName: "cellColor" } }
  },
  {
    label: "Status",
    fieldName: "Status__c",
    cellAttributes: { class: { fieldName: "cellColor" } }
  },
  {
    label: "Manager Comment",
    fieldName: "ManagerComment__c",
    cellAttributes: { class: { fieldName: "cellColor" } }
  },
  {
    type: "button",
    typeAttributes: {
      label: "Edit",
      name: "Edit",
      title: "Edit",
      value: "edit",
      disabled: { fieldName: "isEditDisabled" }
    },
    cellAttributes: { class: { fieldName: "cellColor" } }
  }
];

export default class LeaveRequest extends LightningElement {
  leaverequests = [];
  columns = columns;

  wiredleaverequest;

  isEditModalOpen = false;

  recordId = "";

  closeEditModal() {
    this.isEditModalOpen = false;
  }

  @wire(getLeaveRequests) getLeaves(result) {
    this.wiredleaverequests = result;

    if (result.data) {
      console.log("Fetched leaves:", result.data);

      this.leaverequests = result.data.map((res) => {
        return {
          ...res,
          username: res.User__r ? res.User__r.Name : "",
          cellColor:
            res.Status__c === "Approved"
              ? "slds-theme_success"
              : res.Status__c === "Rejected"
                ? "slds-theme_warning"
                : "",
          isEditDisabled: res.Status__c !== "Pending" // Disable edit button if not pending
        };
      });
    } else if (result.error) {
      console.error("Error fetching leaves:", result.error);
    }
  }

  get norecordsfound() {
    return this.leaverequests.length === 0;
  }

  handleRowAction(event) {
    this.isEditModalOpen = true;
    this.recordId = event.detail.row.Id;
  }

  newLeaveRequest() {
    this.isEditModalOpen = true;
    this.recordId = ""; // Reset recordId for new leave request
  }

  handleSuccess(event) {
    this.isEditModalOpen = false;
    this.showToast("Leave request updated successfully.");
    this.recordId = "";
    // Refresh the data after successful update
    refreshApex(this.wiredLeaves);

    this.refreshGrid();
  }

  @api
  refreshGrid() {
    refreshApex(this.wiredleaverequests);
  }

  showToast(message, title = "Success", variant = "success") {
    const evt = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant
    });
    this.dispatchEvent(evt);
  }
}
