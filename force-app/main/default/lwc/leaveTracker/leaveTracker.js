import { LightningElement } from 'lwc';

export default class LeaveTracker extends LightningElement {
    handlerefreshleaverequests(event) {
        this.refs.myleavescomp.refreshGrid();
    }
}