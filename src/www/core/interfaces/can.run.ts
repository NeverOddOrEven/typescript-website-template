import { Dictionary } from 'core/interfaces/dictionary'

export interface CanRun {
    run(args: Dictionary<any>): void
}
