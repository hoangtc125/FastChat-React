import './App.css';
import { useState, useEffect, memo, useCallback, useRef } from 'react';

let nextConversation =  {
    name: "FastChat",
    id: "",
    chats: "",
    members: [],
    load: false
}


function App() { 

    const [toggle, setToggle] = useState(false)
    
    useEffect(() => {
        nextConversation.name = "FastChat"
        nextConversation.id = ""
        nextConversation.load = false
        window.localStorage.removeItem("FastChatNickname")
        window.localStorage.removeItem("FastChatToken")
    }, [])

    useEffect(() => {
        const timerID = setInterval(() => {
            setToggle(window.localStorage.getItem("FastChatNickname"))
        }, 3000)

        return () => {
            clearInterval(timerID)
        }
    }, [])
    
    return(
        <div className="">
            {window.localStorage.getItem("FastChatNickname") && <Main/>}
            {!window.localStorage.getItem("FastChatNickname") && <Home/>}
        </div>
    ) 
} 

function Main() { 

    return(
        <main className="content">
            <div className="container p-0">
                <div className="header-name ">
                    <button type="button" className="btn btn-secondary"
                        onClick = {() => {
                            nextConversation.name = "FastChat"
                            nextConversation.id = ""
                            nextConversation.load = false
                            window.localStorage.removeItem("FastChatToken")
                            window.localStorage.removeItem("FastChatNickname")
                        }}
                    >
                        Choose nickname again
                    </button>
                    <h1 className="h3 mb-3">FastChat</h1>
                    <h1 className="h3 mb-3">{window.localStorage.getItem("FastChatNickname")}</h1>
                </div>

                <div className="card">
                    <div className="row g-0">
                        <ConnectContainer/>
                        <Conversation/>
                    </div>
                </div>
            </div>
        </main>
    ) 
} 

function Home() {

    const [nickname, setNickname] = useState('')
    const [loginStatus, setLoginStatus] = useState(0)

    const handleOnSubmit = () => {
        let username = nickname.trim()
        if(username.length > 0 && username.length < 100) {
            fetch('https://fastchatapi.deta.dev/userAvailable/', {
            method: 'POST', // or 'PUT'
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nickname: username }),
            credentials: "same-origin",
            // mode: 'no-cors'
            })
            .then(response => {
                return response.json()})
            .then(data => {
                if(!data.error) {
                    window.localStorage.setItem('FastChatToken', data.token);
                    window.localStorage.setItem('FastChatNickname', data.user.nickname);
                    setLoginStatus(1)
                } else {
                    setLoginStatus(2)
                    console.error('Error:', data.error);
                }
            })
            .catch((error) => {
                setLoginStatus(2)
                console.error('Error:', error);
            });
        } else {
            setLoginStatus(3)
        }
    }


    return(
        <div className="chat-body card-home">
            <div className="card-body">
                <h4 className="card-title text-center"> FastChat </h4>
                <hr/>
                <div className="form-inline" id="user-form">
                    <input 
                        autoComplete="off"
                        type="text" className="form-control" 
                        id="user_input" placeholder="Enter your nickname" 
                        value={nickname}
                        onChange= {(e) => setNickname(e.target.value)}
                        onKeyDown={event => {
                            if (event.key === 'Enter') {
                                handleOnSubmit()
                            }
                        }}
                    />
                    <button 
                        id="start" type="submit" 
                        className="btn btn-primary"
                        onClick = {handleOnSubmit}
                    >
                        Start Chat
                    </button>
                </div>
                {loginStatus === 2 && <div className="alert noti-login alert-warning alert-dismissible fade show" role="alert">
                <strong>Your nickname entered is already exist in online FastChat</strong> 
                <hr/>
                You should choose another.
                </div>}
                {loginStatus === 3 && <div className="alert noti-login alert-warning alert-dismissible fade show" role="alert">
                <strong>Your nickname is invalid (Too short or too long)</strong> 
                <hr/>
                You should choose another.
                </div>}
            </div>
        </div>
    )
}

function Conversation() {

    const [messages, setMessages] = useState([])
    const [content, setContent] = useState("")
    const [showGoToBottom, setShowGoToBottom] = useState(false)

    const inputTag = useRef()

    const handleSendMessage = () => {

        let inputValue = content.trim().substring(0, 500)  
        if (!inputValue || nextConversation.load === false) {
            return
        }
        for(let i = 1; i <= inputValue.length / 50; i++) {
            if(50 * i > inputValue.length) continue
            let spaceIndex = inputValue.indexOf(" ", 50 * i);
            if (spaceIndex > 0 && spaceIndex < 50 * (i + 1)) {
                inputValue = inputValue.slice(0, spaceIndex) + "\n" + inputValue.slice(spaceIndex)
            } else {
                inputValue = inputValue.slice(0, 50 * i) + "\n" + inputValue.slice(50 * i)
            }
        }
        setMessages((messages) => [
            ...messages,
            {
                sender: window.localStorage.getItem("FastChatNickname"),
                time: new Date().toLocaleTimeString(),
                message: inputValue
            }
        ])

        fetch(`https://fastchatapi.deta.dev/Conversation/${window.localStorage.getItem("FastChatToken")}/${nextConversation.id}`, {
            method: 'PUT', // or 'PUT'
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                message: inputValue,
                startedAt: new Date().toLocaleTimeString()
             }),
            credentials: "same-origin",
            // mode: 'no-cors'
        })
        .then(response => {
            return response.json()})
            .then(data => {
            })
            .catch((error) => {
                console.error('Error:', error);
            });
            
        setContent("")
    }

    useEffect(() => {
        let messageBody = document.getElementById('messageBody')
        if (messageBody.scrollTop + 600 >= messageBody.scrollHeight) {
            messageBody.scrollTop = messageBody.scrollHeight
        }
        if(messageBody.scrollTop <= messageBody.scrollHeight - 789) {
            setShowGoToBottom(true)
        } else {
            setShowGoToBottom(false)
        }
    }, [messages])

    useEffect(() => {
        let messageBody = document.getElementById('messageBody')

        const handleScrollUp = () => {
            if(messageBody.scrollTop <= messageBody.scrollHeight - 789) {
                setShowGoToBottom(true)
            } else {
                setShowGoToBottom(false)
            }
        }

        messageBody.addEventListener("scroll", handleScrollUp)
        console.log('Add event listener')

        return () => {
            messageBody.removeEventListener("scroll", handleScrollUp)
            console.log('Remove event listener')
        }
    }, [])

    useEffect(() => {
        const timerID = setInterval(() => {
            if(nextConversation.load === true) {
                fetch(`https://fastchatapi.deta.dev/Conversation/${window.localStorage.getItem("FastChatToken")}/${nextConversation.name}`, {
                method: 'POST', // or 'PUT',
                // mode: 'no-cors'
                })
                .then(response => {
                    return response.json()})
                .then(data => {
                    if(data.error) {
                        nextConversation.name = "FastChat"
                        nextConversation.id = ""
                        nextConversation.load = false
                        setMessages([])
                    } else {
                        setMessages((messages) => {
                            if (messages.length >= data.chats.length) {
                                if(data.chats.length === 0) return data.chats
                                if(messages[0].time !== data.chats[0].time) {
                                    return data.chats
                                }
                                return messages
                            } else {
                                return data.chats
                            }
                        })
                    }
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
            }
        }, 1000)

        return () => {
            clearInterval(timerID)
        }
    }, [])

    return (
        <div className="col-12 col-lg-7 col-xl-9">
            <MessageHeader/>
            <div className="position-relative">
                <div className="chat-messages p-4 style-16" id="messageBody"
                    onClick = {() => inputTag.current.focus()}
                >
                    {messages.length > 0 && messages.map((message, id) => {
                        if(message.sender === window.localStorage.getItem("FastChatNickname")) {
                            return <RightMessage key={id} chat={message}/>
                        } else {
                            return <LeftMessage key={id} chat={message}/>
                        }
                    })}
                    {messages.length === 0 && 
                        <div className="alert alert-warning d-flex align-items-center" role="alert">
                                <div>
                                Hãy gửi lời chào tới
                                {nextConversation.name === "FastChat" && <strong> người bạn thích </strong>}
                                {nextConversation.name !== "FastChat" && <strong> {nextConversation.name} </strong>}
                                nhé
                                </div>
                        </div>
                    }
                    {showGoToBottom && 
                        (<button 
                            className="new-message btn btn-outline-secondary"
                            onClick={() => {
                                document.getElementById('messageBody').scrollTop = 
                                document.getElementById('messageBody').scrollHeight
                            }}
                        >
                            Tin nhắn mới
                        </button>)
                    }
                </div>
                <div className="flex-grow-0 py-3 px-4 border-top">
                    <div className="input-group">
                        <input 
                            autoComplete="off"
                            value= {content}
                            ref={inputTag}
                            id="inputMessage" type="text" className="form-control" placeholder="Type your message" 
                            onKeyDown={event => {
                                if (event.key === 'Enter') {
                                    handleSendMessage()
                                }
                            }}
                            onChange={e => setContent(e.target.value)}
                        />
                        <button 
                            onClick = {() => {handleSendMessage();}} 
                            className="btn btn-primary">
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    ) 
} 

function MessageHeader(){

    return (
        <div className="py-2 px-4 border-bottom d-none d-lg-block">
            <div className="d-flex align-items-center py-1">
                <div className="position-relative">
                    <img src="https://bootdey.com/img/Content/avatar/avatar3.png" className="rounded-circle mr-1" alt="Sharon Lessman" width="40" height="40" />
                </div>
                <div className="flex-grow-1 pl-3">
                    <strong>{nextConversation.name}</strong>
                    <div className="text-muted small"><em>typing...</em></div>
                </div>
                <div>
                    <button onClick={()=> alert('Chức năng đang trong quá trình phát triển')} className="btn btn-primary btn-lg mr-1 px-3"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-phone feather-lg"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></button>
                    <button onClick={()=> alert('Chức năng đang trong quá trình phát triển')} className="btn btn-info btn-lg mr-1 px-3 d-none d-md-inline-block"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-video feather-lg"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg></button>
                    <button onClick={()=> alert('Chức năng đang trong quá trình phát triển')} className="btn btn-light border btn-lg px-3"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-more-horizontal feather-lg"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg></button>
                </div>
            </div>
        </div>
    )
} 
  
function RightMessage({chat}) { 
    return (
        <div className="chat-message-right mb-4">
            <div>
                <img src="https://bootdey.com/img/Content/avatar/avatar1.png" className="rounded-circle mr-1" alt="Chris Wood" width="40" height="40" />
                <div className="text-muted small text-nowrap mt-2">{chat.time}</div>
            </div>
            <div className="flex-shrink-1 bg-light rounded py-2 px-3 mr-3">
                <div className="font-weight-bold mb-1">{chat.sender}</div>
                {chat.message}
            </div>
        </div>
    ) 
} 

function LeftMessage({chat}) {
    return (
        <div className="chat-message-left pb-4">
            <div>
                <img src="https://bootdey.com/img/Content/avatar/avatar3.png" className="rounded-circle mr-1" alt="Sharon Lessman" width="40" height="40" />
                <div className="text-muted small text-nowrap mt-2">{chat.time}</div>
            </div>
            <div className="flex-shrink-1 bg-light rounded py-2 px-3 ml-3">
                <div className="font-weight-bold mb-1">{chat.sender}</div>
                {chat.message}
            </div>
        </div>
    ) 
} 
  
function Connect(props) { 
    
    const [noti, setNoti] = useState(props.noti)
    const [name, setName] = useState(props.name)
    const [id, setID] = useState(props.converID)

    const handleChangeConversation = () => {
        fetch(`https://fastchatapi.deta.dev/Conversation/${window.localStorage.getItem("FastChatToken")}/${name}`, {
            method: 'POST', // or 'PUT',
            // mode: 'no-cors'
            })
            .then(response => {
                return response.json()})
            .then(data => {
                nextConversation = {
                    name: name,
                    id: data.id, 
                    chats: data.chats,
                    members: data.members,
                    load: true
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            });

    }

    return (
        <div className="btn list-group-item list-group-item-action border-0" onClick = {handleChangeConversation}>
            <div className="badge bg-success float-right">{noti}</div>
            <div className="d-flex align-items-start">
                <img src="https://bootdey.com/img/Content/avatar/avatar5.png" className="rounded-circle mr-1" alt="Vanessa Tucker" width="40" height="40" />
                <div className="flex-grow-1 ml-3">
                    {name}
                    <div className="small"><span className="fas fa-circle chat-online"></span> Online</div>
                </div>
            </div>
        </div>
    ) 
} 
  
function ConnectContainer() {

    const [connections, setConnections] = useState([])
    const [noti, setNoti] = useState([])
    const [searchResult, setSearchResult] = useState([])
    const [searchInput, setSearchInput] = useState('')
    const [view, setView] = useState(1)

    useEffect(() => {
        const timerID = setInterval(() => {

            fetch('https://fastchatapi.deta.dev/userAvailable/', {
                // mode: 'no-cors'
            })
                .then(res => res.json())
                .then(users => {
                    setConnections(users)
                })
            
            fetch(`https://fastchatapi.deta.dev/Conversation/${window.localStorage.getItem("FastChatToken")}`, {
                method: 'GET', // or 'PUT',
                // mode: 'no-cors'
                })
                .then(response => {
                    return response.json()})
                .then(data => {
                    let newData = []
                    if(data) {
                        data.forEach(element => {
                            const new_element = {
                                ...element, 
                                nickname: element.members.filter((nickname) => nickname !== window.localStorage.getItem("FastChatNickname"))[0]
                            }
                            newData.push(new_element)
                        });
                    }
                    setNoti(newData)
                })
                .catch((error) => {
                    console.error('Error:', error);
                });

        }, 1000)

        return () => {
            clearInterval(timerID)
        }
    }, [])

    useEffect(() => {
        const timerID = setInterval(() => {
            fetch(`https://fastchatapi.deta.dev/userAvailable/${window.localStorage.getItem("FastChatToken")}`, {
                method: 'PUT', // or 'PUT',
                // mode: 'no-cors'
                })
                .then(response => {
                    return response.json()})
                .then(data => {
                    // console.log(data)
                })
                .catch((error) => {
                    console.error('Error:', error);
                });

        }, 1000 * 20)

        return () => {
            clearInterval(timerID)
        }
    }, [])

    return (
        <div className="col-12 col-lg-5 col-xl-3 border-right " id="conversations">

            <div className="px-4 d-none d-md-block">
                <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                            <input type="text" className="form-control my-3" 
                                placeholder="Search nickname..." autoComplete="off"
                                value= {searchInput}
                                onChange = {e => {
                                    setSearchInput(e.target.value)
                                    setSearchResult((view === 1 ? connections : noti).filter(connect => 
                                        connect.nickname.toLowerCase().startsWith(e.target.value.toLowerCase())
                                    ))
                                }}
                            />
                    </div>
                </div>
            </div>
            <div className="btn-group" role="group" aria-label="Basic example" style={{display: 'flex', justifyContent: 'center'}}>
                <button type="button" className="btn btn-secondary"
                    onClick = {() => {
                        setView(1)
                    }}
                >
                    {connections.length} Online
                </button>
                <button type="button" className="btn btn-secondary"
                    onClick = {() => {
                        setView(2)
                    }}
                >
                    {noti.length} Tin nhắn mới
                </button>
            </div>
            {view === 1 && <div className="connections style-16">
                {searchInput.trim().length === 0 && connections.length > 0 &&
                    connections.map((connection) => (
                    <Connect key={connection.nickname} noti="" name = {connection.nickname} converID = {connection.id}/>))
                }
                {searchInput.trim().length === 0 && connections.length === 0 &&
                    <div className="alert alert-warning d-flex align-items-center" role="alert">
                        <div>
                            Không có người nào online
                        </div>
                    </div>
                }
                {searchInput.trim().length > 0 && searchResult.length > 0 &&
                    searchResult.map((connection) => (
                    <Connect key={connection.nickname} noti="" name = {connection.nickname} converID = {connection.id}/>))
                }
                {searchInput.trim().length > 0 && searchResult.length === 0 &&
                    <div className="alert alert-warning d-flex align-items-center" role="alert">
                        <div>
                            Không tìm thấy nickname <strong>{searchInput}</strong>
                        </div>
                    </div>
                }
            </div>}
            {view === 2 && <div className="connections style-16">
                {searchInput.trim().length === 0 && noti.length > 0 &&
                    noti.map((connection) => (
                    <Connect key={connection.nickname} noti="unread" name = {connection.nickname} converID = {connection.id}/>))
                }
                {searchInput.trim().length === 0 && noti.length === 0 &&
                    <div className="alert alert-warning d-flex align-items-center" role="alert">
                        <div>
                            Không có cuộc hội thoại nào mới
                        </div>
                    </div>
                }
                {searchInput.trim().length > 0 && searchResult.length > 0 &&
                    searchResult.map((connection) => (
                    <Connect key={connection.nickname} noti="unread" name = {connection.nickname} converID = {connection.id}/>))
                }
                {searchInput.trim().length > 0 && searchResult.length === 0 &&
                    <div className="alert alert-warning d-flex align-items-center" role="alert">
                        <div>
                            Không tìm thấy cuộc hội thoại với <strong>{searchInput}</strong>
                        </div>
                    </div>
                }
            </div>}
            <hr className="d-block d-lg-none mt-1 mb-0" />
        </div>
    )
}


export default App;