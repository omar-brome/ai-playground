const toWords = (source) => source.trim().split(/\s+/);

export const easyWords = toWords(`
  the and is you that have for not with this but his from they say her she will one all would there their
  what out about who get which go me when make can like time no just him know take people into year your
  good some could them see other than then now look only come its over think also back after use two how
  our work first well way even new want because any these give day most us life child tell world school
  still try last ask need too feel three state never become between high really something most another
  much family own leave put old while mean keep student why let great same big group begin seem country
  help talk where turn problem every start hand might show part against place such again few case week
  company system each right program hear question during play government run small number off always move
  night live point believe hold today bring happen next without before large million must home under water
  room write mother area national money story young fact month different lot study book eye job word though
  business issue side kind four head far black long both little house yes since provide service around friend
  important father sit away until power hour game often yet line political end among ever stand bad lose
  however member pay law meet car city almost include continue set later community name five once white
  least president learn real change team minute best several idea kid body information nothing ago lead social
  understand whether watch together follow parent stop face anything create public already speak others read
  level allow add office spend door health person art sure war history party within grow result open morning
`);

export const mediumWords = toWords(`
  adaptive balance capture delivery economy flexible grammar harvest insight journey kingdom lantern measure
  network observe pattern quality resolve shelter tension upgrade variety welcome ancient border climate diamond
  elegant fortune gallery honest imagine journal kitchen library machine natural orchard precise quarter reliable
  station thunder utility village weather archive browser catalog desktop element feature gesture harmony instance
  justice keyword loyalty monitor notebook option package render signal template universe version workflow analyze
  benefit compass detail engine factory global habitat improve language memory operate process request session
  texture unknown verify window abstract battery central design explore feedback gravity hosting interval layout
  message numeric origin plugin remote storage transit visual worker account browser channel dynamic explain
  format gateway history input license manager notice output payload queue report sandbox target update vector
  widget yellow zipper careful decimal emotion fragile gentle holiday inside ladder market native object planet
  random select travel unique victory wonder yearly agency bridge capsule device energy filter garden handle
  inquiry ladder mission normal opinion profile reason screen ticket useful virtual writing accept branch custom
  domain effort future graph import launch module packet record secure theme upload value worker airport basket
  circuit demand editor figure gather height impact laptop method notify phrase result socket thread urgent volume
  wallet action binary column driver event folder grid header index join kernel loop metric node parse query route
  schema token unit view wire async cache debug export fetch guard hover issue json key local merge npm promise
`);

export const hardWords = toWords(`
  abstraction algorithm asynchronous authentication authorization binary breakpoint callback checksum closure
  concurrency containerization coroutine cryptography database debounce dependency deserialization deterministic
  encapsulation endpoint exception framework generics handshake idempotent immutable inheritance integration
  interface interpolation iteration latency middleware namespace normalization observability orchestration
  polymorphism protocol recursion refactor regression repository serialization synchronization throughput
  transaction transpilation validation virtualization websocket accessibility accumulator adjacency allocation
  amortization backtracking benchmark bootstrap buffering bytecode canonicalization cluster collision compiler
  composition compression deadlock decorator delegation deployment diffing dispatch distributed dockerization
  encryption enumeration executor federation garbage immutable indexing injection invariant kubernetes lifecycle
  loadbalancer memoization microservice migration multiprocessing mutation pagination parallelism partition
  pipeline prefetch profiling provisioning reactivity reconciliation reducer redundancy replication rollback
  semaphore sharding snapshot streaming subscriber tailwind telemetry tokenization tree traversal trie tuple
  unicode unit testing vectorization viewport waterfall webpack websocket wildcard zigzag automaton bitmask
  circuitbreaker commandline csrf dataloader dependencygraph eventloop faulttolerance gracefulshutdown heapify
  hotreload hydration introspection jitter keybinding linkedlist materialization mutex nullability optimistic
  postgresql queuing ratelimit reconciliation resolver runtime scalability scheduler stacktrace throttling
  typescript unhandled virtualization webassembly xor yield zerodowntime metaprogramming monorepo multithreaded
  observability packetization pubsub quadtree rasterization sandboxing shadcn sourcemap staticanalysis
`);

export const wordLists = {
  easy: easyWords,
  medium: mediumWords,
  hard: hardWords,
};
