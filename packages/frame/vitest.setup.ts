// React 18's `act(...)` only batches updates and suppresses its own warning
// when this flag is set; without it every render in a React test logs
// "not configured to support act(...)" even though nothing is wrong.
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
