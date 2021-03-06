import {ProjectStore} from '../project/project.store';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Workflow, WorkflowNode, WorkflowTriggerConditionCache} from '../../model/workflow.model';
import {Injectable} from '@angular/core';
import {List, Map} from 'immutable';
import {Observable} from 'rxjs/Observable';
import {WorkflowService} from './workflow.service';
import {GroupPermission} from '../../model/group.model';

@Injectable()
export class WorkflowStore {

    static RECENT_WORKFLOW_KEY = 'CDS-RECENT-WORKFLOW';
    WORKFLOW_ORIENTATION_KEY = 'CDS-WORKFLOW-ORIENTATION';

    // List of all workflows.
    private _workflows: BehaviorSubject<Map<string, Workflow>> = new BehaviorSubject(Map<string, Workflow>());

    private _recentWorkflows: BehaviorSubject<List<Workflow>> = new BehaviorSubject(List<Workflow>());


    constructor(private _projectStore: ProjectStore, private _workflowService: WorkflowService) {
        this.loadRecentWorkflows();
    }

    loadRecentWorkflows(): void {
        let arrayWorkflows = JSON.parse(localStorage.getItem(WorkflowStore.RECENT_WORKFLOW_KEY));
        this._recentWorkflows.next(List.of(...arrayWorkflows));
    }

    /**
     * Get recent workflow.
     * @returns {Observable<List<Workflow>>}
     */
    getRecentWorkflows(): Observable<List<Workflow>> {
        return new Observable<List<Workflow>>(fn => this._recentWorkflows.subscribe(fn));
    }

    /**
     * Use by router to preload workflow
     * @param key
     * @param workflowName Workflow name
     * @returns {Observable<Workflow>}
     */
    getWorkflowResolver(key: string, workflowName: string): Observable<Workflow> {
        let store = this._workflows.getValue();
        let workflowKey = key + '-' + workflowName;
        if (store.size === 0 || !store.get(workflowKey)) {
            return this._workflowService.getWorkflow(key, workflowName).map( res => {
                this._workflows.next(store.set(workflowKey, res));
                return res;
            });
        } else {
            return Observable.of(store.get(workflowKey));
        }
    }

    /**
     * Get workflows
     * @returns {Observable<Application>}
     */
    getWorkflows(key: string, workflowName?: string): Observable<Map<string, Workflow>> {
        let store = this._workflows.getValue();
        let workflowKey = key + '-' + workflowName;
        if (workflowName && !store.get(workflowKey)) {
            this.resync(key, workflowName);
        }
        return new Observable<Map<string, Workflow>>(fn => this._workflows.subscribe(fn));
    }

    resync(key: string, workflowName: string) {
        let store = this._workflows.getValue();
        let workflowKey = key + '-' + workflowName;
        this._workflowService.getWorkflow(key, workflowName).subscribe(res => {
            this._workflows.next(store.set(workflowKey, res));
        }, err => {
            this._workflows.error(err);
        });
    }

    /**
     * Add a new workflow in a project
     * @param key Project unique key
     * @param workflow Workflow to add
     */
    addWorkflow(key: string, workflow: Workflow): Observable<Workflow> {
        return this._workflowService.addWorkflow(key, workflow);
    }

    renameWorkflow(key: string, name: string, workflow: Workflow): Observable<Workflow> {
        return this._workflowService.updateWorkflow(key, name, workflow).map(w => {
            let workflowKey = key + '-' + workflow.name;
            let store = this._workflows.getValue();
            this._workflows.next(store.set(workflowKey, w));
            return w;
        });
    }

    /**
     * Update a workflow
     * @param key Project unique key
     * @param workflow workflow to update
     */
    updateWorkflow(key: string, workflow: Workflow): Observable<Workflow> {
        return this._workflowService.updateWorkflow(key, workflow.name, workflow).map(w => {
            let workflowKey = key + '-' + workflow.name;
            let store = this._workflows.getValue();
            this._workflows.next(store.set(workflowKey, w));
            return w;
        });
    }

    /**
     * Delete the given workflow
     * @param key Project unique key
     * @param workflow Workflow name
     */
    deleteWorkflow(key: string, workflow: Workflow): Observable<boolean> {
        return this._workflowService.deleteWorkflow(key, workflow).map(w => {
            let workflowKey = key + '-' + workflow.name;
            let store = this._workflows.getValue();
            this._workflows.next(store.delete(workflowKey));
            return w;
        });
    }

    getTriggerCondition(key: string, workflowName: string, nodeID: number): Observable<WorkflowTriggerConditionCache> {
        return this._workflowService.getTriggerCondition(key, workflowName, nodeID);
    }

    getTriggerJoinCondition(key: string, workflowName: string, joinID: number): any {
        return this._workflowService.getTriggerJoinCondition(key, workflowName, joinID);
    }

    getDirection(key: string, name: string) {
        let o = localStorage.getItem(this.WORKFLOW_ORIENTATION_KEY);
        if (o) {
            let j = JSON.parse(o);
            if (j[key + '-' + name]) {
                return j[key + '-' + name];
            }
        }
        return 'TB';
    }

    setDirection(key: string, name: string, o: string) {
        let ls = localStorage.getItem(this.WORKFLOW_ORIENTATION_KEY);
        let j = {};
        if (ls) {
            j = JSON.parse(ls);
        }
        j[key + '-' + name] = o;
        localStorage.setItem(this.WORKFLOW_ORIENTATION_KEY, JSON.stringify(j));
    }

    addPermission(key: string, detailedWorkflow: Workflow, gp: GroupPermission) {
        return this._workflowService.addPermission(key, detailedWorkflow.name, gp).map(w => {
            let workflowKey = key + '-' + detailedWorkflow.name;
            let store = this._workflows.getValue();
            let workflowToUpdate = store.get(workflowKey);
            workflowToUpdate.groups = w.groups;
            workflowToUpdate.last_modified = w.last_modified;
            this._workflows.next(store.set(workflowKey, workflowToUpdate));
            return w;
        });
    }

    updatePermission(key: string, detailedWorkflow: Workflow, gp: GroupPermission) {
        return this._workflowService.updatePermission(key, detailedWorkflow.name, gp).map(w => {
            let workflowKey = key + '-' + detailedWorkflow.name;
            let store = this._workflows.getValue();
            let workflowToUpdate = store.get(workflowKey);
            workflowToUpdate.groups = w.groups;
            workflowToUpdate.last_modified = w.last_modified;
            this._workflows.next(store.set(workflowKey, workflowToUpdate));
            return w;
        });
    }

    deletePermission(key: string, detailedWorkflow: Workflow, gp: GroupPermission) {
        return this._workflowService.deletePermission(key, detailedWorkflow.name, gp).map(w => {
            let workflowKey = key + '-' + detailedWorkflow.name;
            let store = this._workflows.getValue();
            let workflowToUpdate = store.get(workflowKey);
            workflowToUpdate.groups = w.groups;
            workflowToUpdate.last_modified = w.last_modified;
            this._workflows.next(store.set(workflowKey, workflowToUpdate));
            return w;
        });
    }
}
