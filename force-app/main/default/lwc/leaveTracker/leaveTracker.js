import { LightningElement } from 'lwc';

export default class LeaveTracker extends LightningElement {
    
    handlerefreshleaverequests() {
        // Get reference to the leave request component
        const leaveRequestComponent = this.template.querySelector('c-leave-request');
        
        if (leaveRequestComponent) {
            leaveRequestComponent.refreshGrid();
        } else {
            console.warn('Leave request component not found');
        }
    }
}