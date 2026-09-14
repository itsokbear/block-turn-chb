/** Cell-native artwork: the ears are decorative and extend above the head cell. */
export function BruniHead(){
 return <svg className="bruni-head-art" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
  <path fill="#b29be9" d="M25 24 9-30 5-85 29-59 42 19Z"/>
  <path fill="#ded0ff" d="M5-85 29-59 42 19 32 13 19-48Z"/>
  <path fill="#ec8fcb" d="M25 11 13-31 11-67 24-47 35 17Z"/>
  <path fill="#c1acf0" d="M59 18 72-57 94-85 93-33 76 25Z"/>
  <path fill="#e5d7ff" d="M59 18 72-57 94-85 81-43 70 19Z"/>
  <path fill="#ef99d0" d="M68 16 79-44 88-66 86-31 76 16Z"/>
  <path fill="#b8a0eb" d="M30 15 52 10 74 19 88 39 97 65 83 84 57 93 31 87 9 70 8 52 19 30Z"/>
  <path fill="#d2bffc" d="M30 15 52 10 64 36 53 69 33 54 19 30Z"/>
  <path fill="#e7d9ff" d="M52 10 64 36 59 69 48 77 35 69 33 54Z"/>
  <path fill="#9c82d3" d="M74 19 88 39 97 65 75 59 64 36Z"/>
  <path fill="#c6aff5" d="M9 70 33 54 35 69 48 77 31 87Z"/>
  <path fill="#a68ddd" d="M59 69 75 59 97 65 83 84 57 93 48 77Z"/>
  <path fill="#f5a9d5" d="M35 69 60 69 49 82Z"/>
  <path fill="#d66da9" d="M49 75 60 69 49 82Z"/>
  <path fill="#ff4c13" d="M18 43 30 37 34 52 28 64 15 58Z M69 37 82 44 86 58 73 64 65 51Z"/>
  <path fill="#201529" d="M23 44 28 46 28 54 23 58 20 52Z M74 44 79 47 80 54 75 58 71 52Z"/>
  <path fill="#fff9ee" d="M39 84 48 85 48 99 40 98Z M51 85 60 83 59 98 51 99Z"/>
 </svg>;
}
export function BruniTail({angle}:{angle:number}){
 return <svg className="bruni-tail-art" viewBox="0 0 100 100" style={{transform:`rotate(${angle}deg)`}} aria-hidden="true" focusable="false">
  <path fill="#b8a0eb" d="M3 4 98 50 3 96Z"/>
  <path fill="#d5c3ff" d="M3 4 98 50 29 44Z"/>
  <path fill="#a28ad9" d="M3 96 29 44 98 50Z"/>
  <path fill="#c1aaf0" d="M3 4 29 44 3 96Z"/>
 </svg>;
}
