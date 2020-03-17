
function Updater(instance) {
    this.instance = instance
    this.pendingStates = []
    this.pendingCallbacks = []
    this.isPending = false
    this.nextProps = this.nextContext = null
    this.clearCallbacks = this.clearCallbacks.bind(this)
} 
Updater.prototype = {
    emitUpdate(nextProps, nextContext) {
        nextProps || !updateQueue.isPending 
        ? this.updateComponent()
        : updateQueue.add(this)
    },
    updateComponent() {

    },
    addState(nextState) {
        
    }
}

export let updateQueue = {
    updaters: [],
    isPending: false,
    add(updater) {
        _.addItem(this.updaters, updater)
    },
    batchUpdate() {
        if(this.isPending) {
            return
        }
        this.isPending = true
        let { updaters } = this
        let updater
        while(updater = updaters.pop()) {
            updater.updateComponent()
        }
        this.isPending = false
    }
}