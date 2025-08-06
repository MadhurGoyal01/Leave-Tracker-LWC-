import { LightningElement, wire, track } from "lwc";
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
  @track myLeaves = [];
  columns = columns;
  wiredLeaves;
  isEditModalOpen = false;
  recordId = "";
  currentuserid = Id;

  closeEditModal() {
    this.isEditModalOpen = false;
    this.recordId = ""; // Reset recordId when closing
  }

  @wire(getMyLeaves) 
  getLeaves(result) {
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
      this.showToast("Error fetching leave requests", "Error", "error");
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
    console.log('Record saved successfully:', event.detail.id);
    
    this.recordId = "";
    this.isEditModalOpen = false;

    this.showToast("Leave request saved successfully.");

    // Safely refresh the Apex wire
    if (this.wiredLeaves) {
      refreshApex(this.wiredLeaves);
    }

    // Dispatch custom event to parent component
    const refreshEvent = new CustomEvent("refreshleaverequests");
    this.dispatchEvent(refreshEvent);
  }

  handleSubmit(event) {
    event.preventDefault(); // Prevent default form submission

    const fields = { ...event.detail.fields };
    
    // Set status to Pending for new requests
    if (!this.recordId) {
      fields.Status__c = 'Pending';
      fields.User__c = this.currentuserid; // Ensure user is set
    }

    // Validation: Check if From Date is after To Date
    if (fields.FromDate__c && fields.ToDate__c) {
      if (new Date(fields.FromDate__c) > new Date(fields.ToDate__c)) {
        this.showToast('From Date cannot be after To Date.', 'Validation Error', 'error');
        return;
      }
    }

    // Validation: Check if From Date is in the past (only for new requests)
    if (!this.recordId && fields.FromDate__c) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to compare dates only
      const fromDate = new Date(fields.FromDate__c);
      
      if (fromDate < today) {
        this.showToast('From Date cannot be in the past.', 'Validation Error', 'error');
        return;
      }
    }

    // Get form reference and submit
    const form = this.template.querySelector('lightning-record-edit-form');
    if (form) {
      form.submit(fields);
    } else {
      console.error('Form not found when trying to submit.');
      this.showToast('Internal Error: Form not found.', 'Error', 'error');
    }
  }

  get modalname() {
    return this.recordId ? "Edit Leave Request" : "New Leave Request";
  }

  handleError(event) {
    console.error("Form error: ", event.detail);
    let message = 'An error occurred while saving the record.';
    
    if (event.detail && event.detail.message) {
      message = event.detail.message;
    } else if (event.detail && event.detail.detail) {
      message = event.detail.detail;
    }
    
    this.showToast(message, 'Error', 'error');
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