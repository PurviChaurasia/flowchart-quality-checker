import './App.css';
import React, {useEffect, useState} from "react";
import {database} from "./firebase";
import {get,set,ref} from 'firebase/database'
import mermaid from 'mermaid'
const flowchart_inputs = [
  {
    title:'Logical Flow and Decision Node Accuracy',
    key:'logical_score',
    options:[
      {
        label:'Excellent',
        value:3,
        info: 'The flowchart demonstrates a clear and logical sequence with all decision nodes and loops used correctly. Minor imperfections do not hinder overall clarity.'
      },
      {
        label:'Good',
        value:2,
        info: 'There are some issues with logical flow or decision node accuracy, leading to occasional clarity problems, but the main intent and logic of the flowchart remain intact.'
      },
      {
        label: 'Poor',
        value: 1,
        info: 'The flowchart suffers from frequent logical inconsistencies or misuse of decision nodes and loops, significantly impacting the ability to follow the process accurately.'
      }
    ]
  },
  {
    title:'Complexity and Length',
    key:'complexity',
    options:[
      {
        label:'Appropriate',
        value:3,
        info: 'Appropriately Complex - The flowchart complexity and length are appropriate, reflecting the process needs without unnecessary elements.'
      },
      {
        label:'High',
        value:2,
        info: 'Slightly More Complex But Still Useable - The flowchart is slightly more complex or longer than necessary, which may slightly affect comprehension or scalability.'
      },
      {
        label: 'Very High',
        value: 1,
        info: 'Unnecessarily High Complexity that affects Usability - The flowchart is too complex or lengthy, significantly hindering comprehension and requiring simplification.'
      },
      {
        label: 'Error Laden',
        value: 0,
        info: 'The flowchart has other issues related to complexity which affects usability.'
      }
    ]
  },
  {
    title: 'Allignment with Process Goals',
    key: 'process_alignment',
    options:[
      {
        label: 'Excellent',
        value: 3,
        info: 'The flowchart aligns perfectly or closely with the intended process goals.'
      },
      {
        label: 'Good',
        value: 2,
        info: 'Some deviation from the process goals is present but does not completely misrepresent the process.'
      },
      {
        label: 'Poor',
        value: 1,
        info: 'The flowchart has poor alignment with process goals, with several goals misrepresented or absent.'
      }
    ]
  },
  {
    title: "Overall Score",
    key: 'overall_score',
    options:[
      {
        label: 'Excellent',
        value: 3,
        info: 'The flowchart is clear, logical, well-structured, and aligns with process goals.'
      },
      {
        label: 'Good',
        value: 2,
        info: 'The flowchart is generally understandable with minor issues; improvements are possible.'
      },
      {
        label: 'Poor',
        value: 1,
        info: 'The flowchart has significant issues across multiple areas and is difficult to interpret or use.'
      }
    ]
  }
]

const other_answers=[
  {
    label:"Applied scenario",
    key:'applied_scenario'
  },
  {
    label:"Fact retrieval",
    key:'fact_retrieval'
  },
  {
    label: "Flow Referential",
    key: 'flow_referential'
  }
]

const answer_inputs = [
  {
    title:'Correctness of the Question',
    key:'question_correctness',
    options:[
      {
        label:'True',
        value:1
      },
      {
        label:'False',
        value:0
      },
      {
        label: 'Somewhat',
        value: -1
      }
    ]
  },
  {
    title:'Correctness of Answer',
    key:'answer_correctness',
    options:[
      {
        label:'True',
        value:1
      },
      {
        label:'False',
        value:0
      },
      {
        label: 'Somewhat',
        value: -1
      }
    ]
  },
  {
    title: 'Complexity and Quality of Question',
    key: 'complexity_quality',
    options:[
      {
        label:'Excellent',
        value:3,
        info: 'Complex, requires thorough analysis, clear and precise.'
      },
      {
        label:'Good',
        value:2,
        info: 'Moderately complex, answer not immediately apparent, clear and precise.'
      },
      {
        label: 'Average',
        value:1,
        info: 'Straightforward, lacks complexity.'
      },
      {
        label: 'Poor',
        value: 0,
        info: 'Overly complex or unclear, difficult to ascertain correctness.'
      }
    ]
  },
  {
    title: 'Overall QA and Flowchart Pair Rating',
    key: 'overall',
    options:[
      {
        label:'The final set MUST have this QA pair.',
        value:3,
        info:'The question is excellent in quality, complexity, and correctness, making it a prime candidate for AI testing.'
      },
      {
        label:'The final resource may have this QA pair.',
        value:2,
        info: 'The question is generally good but might require minor improvements. Still valid for AI testing'
      },
      {
        label: 'This QA pair can be omitted based on our selection criteria',
        value:1,
        info: 'The question and/or answer have significant issues and should be reconsidered or excluded.'
      },
      {
        label:'This QA pair must be omitted',
        value:0,
        info: 'The question is redundant as a better version exists in another category or it fails to meet the basic criteria for inclusion.'
      }
    ]
  }
]
function Help({info}){
  const [show,setShow]=useState(false)
  return <div onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)} className={'text-lg relative font-bold cursor-help'}>
    ?
    {show&&<div className={'absolute left-full -translate-y-1/2 text-xs font-normal border w-[300px] top-1/2 translate-x-2 bg-white p-2 rounded'}>{info}</div>}
  </div>
}
function Selector({inputs, path,defaultValues}){
  return <div className={'grid grid-cols-2 gap-3'}>
    {inputs.map(input=><div className={'bg-white rounded-md border shadow py-3 px-6'}  onChange={(e)=>{
      set(ref(database,path+'/'+input.key),e.target.value)
    }}>
      <div className={'text- font-medium text-start mb-3'}>{input.title}</div>
      <div className={'flex flex-col gap-1'}>

        {input.options.map(o=><div className={'flex items-center gap-2'}>
          <input className={'text-left'} defaultChecked={defaultValues[input.key]===o.value} value={o.value} type={'radio'} name={path+input.key} placeholder={'Test'}/>
          <div className={'text-left'}>{o.label}</div>
          {o.info&&<Help info={o.info}/> }
        </div>)}
      </div>
    </div>)}
  </div>
}

function AnswerInputRenderer({path, answers}){
  return <div>
    {answers.map((answer,i)=>answer&&<div className={'text-left'}>
      <h2 className={'mb-2'}><b><u>Question:</u></b> {answer.Q}</h2>
      {Object.keys(answer).map(key=>key.startsWith('A')&&<p><b>{key}:</b> {answer[key]}</p>)}<br/>
      <Selector path={path+'/'+i+'/scores'} inputs={answer_inputs} defaultValues={answer['scores']}/>
      <hr className={'my-8'}/>
    </div>)}
  </div>
}

function App() {
  const [selectedFile,setSelectedFile]=useState()
  const [idText,setIdText]=useState('')
  const [completed,setCompleted]=useState()
  const [total,setTotal]=useState()
  const [loading,setLoading]=useState(false)
  useEffect(() => {
    mermaid.run();
  }, [selectedFile]);
  useEffect(() => {
    mermaid.initialize({ startOnLoad: true })
    get(ref(database,'/')).then(snapshot=>{
      const val = snapshot.val()
      setTotal(Object.keys(val).length)
      setCompleted(Object.values(val).filter(val=>val.scores?.flag).length)
    })
  }, []);
  function onSet(){
    setLoading(true)
    get(ref(database,'/'+idText)).then(snapshot=>{
      if(!snapshot.val()){
        return alert('Invalid code')
      }
      setSelectedFile(snapshot.val())

    })
        .finally(()=>{
          setLoading(false)
        })
  }
  
  function onSubmit(){
    /*
    get(ref(database,'/'+idText)).then(snapshot=>{
      setSelectedFile(snapshot.val())
      const f = snapshot.val()
      console.log(Object.values(f['scores']))
      let all_done = Object.values(f['scores']).every(x=>Boolean(x)||x===0) && other_answers.every(answer=>Object.values(f['QA'][answer.key]['scores']).every(Boolean))
      if(all_done){
        set(ref(database,'/'+idText+'/scores/flag'),1)
      } else {
        alert('Please complete all')
      }
    })
    */
    set(ref(database,'/'+idText+'/scores/flag'),1)
    alert("Done!")
  }
  
  return (
    <div className="App h-screen flex flex-col max-w-screen-xl mx-auto px-5 text-start">
      <div className={'py-5 flex justify-between'}>
        <div className={'text-4xl font-bold'}>Flowchart Quality Checker</div>
        <div className={'flex justify-between'}>
      <a href='https://humdrum-bottom-a65.notion.site/Flowchart-Quality-Evaluation-Rubric-059f0fd3db2148a9bc511bacbc8f807f?pvs=4' target='_blank' rel='noopener noreferrer' className={'text-2xl px-2 py-1 hover:bg-blue-500 hover:text-white transition-colors duration-300 ease-in-out'}>Flowchart Rubric</a>
      <a href='https://humdrum-bottom-a65.notion.site/Q-A-Quality-Evaluation-Rubric-4ff0976d121a46e08216ac2fdd2a9a47?pvs=4' target='_blank' rel='noopener noreferrer' className={'text-2xl px-2 py-1 hover:bg-blue-500 hover:text-white transition-colors duration-300 ease-in-out'}style={{ marginLeft: '30px' }}>QA Rubric</a>
    </div>
        <div className={'text-4xl font-bold'}>{completed}/{total}</div>
      </div>
      <form className={'flex gap-3 items-center'} onSubmit={e=>{
        e.preventDefault()
        onSet()
      }}>
        <input disabled={loading} className={'grow bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5'} value={idText} onChange={e=>setIdText(e.target.value)} placeholder={'Enter ID'}/>
        <button disabled={loading} className={'text-white bg-blue-700 hover:bg-blue-800 disabled:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center'} onClick={onSet}>Set</button>
      </form>
      {selectedFile&&<div className={'grid grid-cols-2 overflow-auto pb-10'}>
        <div className={'overflow-y-scroll'}>
        <pre className="mermaid">
          {selectedFile?.mermaid}
        </pre>
        </div>
        <div className={'overflow-y-scroll overflow-x-visible'}>
            <h3 className={'text-3xl font-semibold mb-8 mt-8'}>Flow chart questions</h3>
            <Selector path={`/${idText}/scores`} defaultValues={selectedFile.scores} inputs={flowchart_inputs}/>
          <h3 className={'text-3xl font-semibold mb-4 mt-8'}>Other questions</h3>
          {other_answers.map(answer=><div>
            <h5 className={'text-2xl font-medium underline mb-5 mt-8'}>{answer.label}</h5>
            <AnswerInputRenderer answers={selectedFile[answer.key]} path={`/${idText}/${answer.key}`}/>
          </div>)}
          <button className={'w-full text-white bg-blue-700 hover:bg-blue-800 disabled:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm sm:w-auto px-5 py-2.5 text-center'} onClick={onSubmit}>Submit</button>

        </div>
      </div>}

    </div>
  );
}

export default App;
