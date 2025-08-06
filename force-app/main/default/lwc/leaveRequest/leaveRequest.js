import { LightningElement, api , track} from "lwc";
import getFilteredLeaveRequestsPaginated from "@salesforce/apex/LeaveRequestController.getFilteredLeaveRequestsPaginated";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

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
  @track leaverequests = [];
  columns = columns;

  isEditModalOpen = false;
  recordId = "";

  // Filters
  searchKey = "";
  selectedStatus = "";
  fromDate = "";
  toDate = "";

  // Lazy loading
  isLoading = false;
  pageSize = 10;
  offset = 0;
  allLoaded = false;

  connectedCallback() {
    this.loadMoreLeaves();
  }

  // Format records
  formatData(data) {
    return data.map((res) => ({
      ...res,
      username: res.User__r?.Name || "",
      cellColor:
        res.Status__c === "Approved"
          ? "slds-theme_success"
          : res.Status__c === "Rejected"
            ? "slds-theme_warning"
            : "",
      isEditDisabled: res.Status__c !== "Pending"
    }));
  }

  get norecordsfound() {
    return this.leaverequests.length === 0;
  }

  get statusOptions() {
    return [
      { label: "All", value: "" },
      { label: "Pending", value: "Pending" },
      { label: "Approved", value: "Approved" },
      { label: "Rejected", value: "Rejected" }
    ];
  }

  // Input handlers
  handleSearch(event) {
    this.searchKey = event.target.value;
  }

  handleStatusChange(event) {
    this.selectedStatus = event.detail.value;
  }

  handleFromDate(event) {
    this.fromDate = event.target.value;
  }

  handleToDate(event) {
    this.toDate = event.target.value;
  }

  // Apply filters
  applyFilters() {
    this.offset = 0;
    this.allLoaded = false;
    this.leaverequests = [];
    this.loadMoreLeaves();
  }

  clearFilters() {
    this.searchKey = "";
    this.selectedStatus = "";
    this.fromDate = "";
    this.toDate = "";
    this.offset = 0;
    this.allLoaded = false;
    this.leaverequests = [];
    this.loadMoreLeaves();
  }

  // Lazy load records
  loadMoreLeaves() {
    if (this.allLoaded) return;

    this.isLoading = true;
    getFilteredLeaveRequestsPaginated({
      searchKey: this.searchKey,
      status: this.selectedStatus,
      fromDateStr: this.fromDate,
      toDateStr: this.toDate,
      offsetSize: this.offset,
      limitSize: this.pageSize
    })
      .then((result) => {
        const formatted = this.formatData(result);
        this.leaverequests = [...this.leaverequests, ...formatted];
        this.offset += this.pageSize;
        if (result.length < this.pageSize) {
          this.allLoaded = true;
        }
        this.isLoading = false;
      })
      .catch((error) => {
        this.isLoading = false;
        console.error("Lazy load error", error);
        this.showToast("Error loading records", "Error", "error");
      });
  }

  handleLoadMore(event) {
    event.target.isLoading = true;
    this.loadMoreLeaves();
    event.target.isLoading = false;
  }

  // Modal-related
  handleRowAction(event) {
    this.isEditModalOpen = true;
    this.recordId = event.detail.row.Id;

  }

  newLeaveRequest() {
    this.isEditModalOpen = true;
    this.recordId = "";
  }

  closeEditModal() {
    this.isEditModalOpen = false;
  }

  handleSuccess() {
    this.isEditModalOpen = false;
    this.showToast("Leave request updated successfully.");
    this.offset = 0;
    this.allLoaded = false;
    this.leaverequests = [];
    this.loadMoreLeaves();
  }

  @api
  refreshGrid() {
    this.offset = 0;
    this.allLoaded = false;
    this.leaverequests = [];
    this.loadMoreLeaves();
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
