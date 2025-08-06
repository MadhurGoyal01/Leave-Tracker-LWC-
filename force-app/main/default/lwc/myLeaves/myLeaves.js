import { LightningElement, wire } from "lwc";
import getMyLeaves from "@salesforce/apex/LeaveRequestController.getMyLeaves";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import Id from "@salesforce/user/Id";

import { refreshApex } from "@salesforce/apex";

const columns = [
  {
    label: "Request Id",
    fieldName: "Name",
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

export default class MyLeaves extends LightningElement {
  myLeaves = [];
  columns = columns;

  wiredLeaves;

  isEditModalOpen = false;

  recordId = "";

  currentuserid = Id;

  closeEditModal() {
    this.isEditModalOpen = false;
  }

  @wire(getMyLeaves) getLeaves(result) {
    this.wiredLeaves = result;

    if (result.data) {
      console.log("Fetched leaves:", result.data);

      this.myLeaves = result.data.map((res) => {
        return {
          ...res,
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
    return this.myLeaves.length === 0;
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

    const refreshevent = new CustomEvent("refreshleaverequests");
    this.dispatchEvent(refreshevent);
  }

  handleSubmit(event) {
    event.preventDefault(); // Prevent default submit
    console.log("event.detail.fields ", event.detail.fields);

    const fields = { ...event.detail.fields };

    fields.Status__c = "Pending"; // Set default status to Pending

    if(new Date(fields.FromDate__c) > new Date(fields.ToDate__c)) {
      this.showToast("From Date cannot be after To Date.", "Error", "error");
      return;
    } else if (new Date() > new Date(fields.FromDate__c)) {
      this.showToast("From Date cannot be in the past.", "Error", "error");
      return;
    } else {
        this.refs.leaveRequestForm.submit(fields); // Submit the form with fields
    }
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
