import {TempMocks} from './index'

declare global {
    var TempMocks: typeof TempMocks
}

export default TempMocks