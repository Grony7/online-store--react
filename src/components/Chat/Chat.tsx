import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import styles from './Chat.module.scss';
import classNames from 'classnames';

interface ChatProps {
  userToken: string;
  userId: string | number;
}

interface Message {
  id?: string | number;
  text: string;
  isFromSupport: boolean;
  createdAt: string;
  userId?: string | number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337';

export const Chat: React.FC<ChatProps> = ({ userToken, userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Автоскролл к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Загрузка истории сообщений из API
  const loadMessageHistory = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_URL}/api/messages/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const messageHistory = data.data || [];
        setMessages(messageHistory);
        
        // Сохраняем в localStorage для быстрого доступа
        saveMessagesToCache(messageHistory);
      } else {
        // Пытаемся загрузить из localStorage
        const cachedMessages = loadMessagesFromCache();
        if (cachedMessages.length > 0) {
          setMessages(cachedMessages);
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке истории сообщений:', error);
      
      // Пытаемся загрузить из localStorage при ошибке сети
      const cachedMessages = loadMessagesFromCache();
      if (cachedMessages.length > 0) {
        setMessages(cachedMessages);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Сохранение сообщений в localStorage
  const saveMessagesToCache = (messagesToSave: Message[]) => {
    try {
      localStorage.setItem(`chat_history_${userId}`, JSON.stringify(messagesToSave));
    } catch (error) {
      console.error('Ошибка сохранения в localStorage:', error);
    }
  };

  // Загрузка сообщений из localStorage
  const loadMessagesFromCache = (): Message[] => {
    try {
      const cachedMessages = localStorage.getItem(`chat_history_${userId}`);
      return cachedMessages ? JSON.parse(cachedMessages) : [];
    } catch (error) {
      console.error('Ошибка загрузки из localStorage:', error);
      return [];
    }
  };

  // Принудительное обновление истории
  const refreshHistory = () => {
    loadMessageHistory();
  };

  // Очистка истории чата
  const clearChatHistory = () => {
    const confirmed = window.confirm('Вы уверены, что хотите очистить историю чата?');
    if (confirmed) {
      setMessages([]);
      localStorage.removeItem(`chat_history_${userId}`);
    }
  };

  // Инициализация WebSocket соединения
  useEffect(() => {
    if (!userToken || !userId) {
      console.error('Отсутствуют userToken или userId');
      return;
    }

    // Сначала загружаем историю сообщений
    loadMessageHistory();

    const newSocket = io(API_URL, {
      auth: {
        token: userToken
      },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      
      // Присоединяемся к комнате пользователя
      newSocket.emit('join', { userId: userId });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('newMessage', (message: Message) => {
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages, message];
        saveMessagesToCache(updatedMessages);
        return updatedMessages;
      });
      
      // Если чат закрыт и сообщение от поддержки, показываем уведомление
      if (!isOpen && message.isFromSupport) {
        setHasUnreadMessages(true);
      }
    });

    newSocket.on('messageHistory', (history: Message[]) => {
      setMessages(history);
      saveMessagesToCache(history);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Ошибка подключения WebSocket:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [userId, userToken, isOpen]);

  // Автоскролл при новых сообщениях
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Отправка сообщения
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !socket || !isConnected) {
      return;
    }

    try {
      // Отправляем сообщение через REST API для гарантии сохранения
      const response = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            text: newMessage,
            isFromSupport: false
          }
        })
      });

      if (response.ok) {
        // Также отправляем через WebSocket для мгновенной доставки
        socket.emit('message', {
          text: newMessage,
          userId: userId,
          isFromSupport: false
        });

        setNewMessage('');
      } else {
        // Если API недоступен, попробуем только через WebSocket
        socket.emit('message', {
          text: newMessage,
          userId: userId,
          isFromSupport: false
        });
        
        setNewMessage('');
      }
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error);
      
      // Fallback: отправляем только через WebSocket
      socket.emit('message', {
        text: newMessage,
        userId: userId,
        isFromSupport: false
      });
      
      setNewMessage('');
    }
  };

  // Открытие/закрытие чата
  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasUnreadMessages(false);
    }
  };

  // Форматирование времени
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading) {
    return (
      <>
        <button
          className={classNames(styles.chatButton, {
            [styles.hasUnread]: hasUnreadMessages
          })}
          onClick={toggleChat}
          title="Чат с поддержкой"
        >
          💬
        </button>

        {isOpen && (
          <div className={styles.chatWindow}>
            <div className={styles.chatLoading}>
              <div className={styles.loadingSpinner}></div>
              <p>Загрузка истории сообщений...</p>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* Кнопка чата */}
      <button
        className={classNames(styles.chatButton, {
          [styles.hasUnread]: hasUnreadMessages
        })}
        onClick={toggleChat}
        title="Чат с поддержкой"
      >
        💬
      </button>

      {/* Окно чата */}
      {isOpen && (
        <div className={styles.chatWindow}>
          {/* Заголовок */}
          <div className={styles.chatHeader}>
            <div>
              <h3>Чат поддержки</h3>
              <div className={styles.chatStatus}>
                <span className={classNames(styles.statusIndicator, {
                  [styles.connected]: isConnected,
                  [styles.disconnected]: !isConnected
                })}>
                  {isConnected ? 'Подключено' : 'Не подключено'}
                </span>
                <span style={{ fontSize: '12px', marginLeft: '8px' }}>
                  Сообщений: {messages.length}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={refreshHistory} 
                className={styles.refreshBtn} 
                title="Обновить историю"
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '16px', 
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ⟳
              </button>
              <button 
                onClick={clearChatHistory}
                title="Очистить историю чата"
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '16px', 
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                🗑️
              </button>
              <button 
                className={styles.closeButton}
                onClick={toggleChat}
                title="Закрыть чат"
              >
              ×
              </button>
            </div>
          </div>

          {/* Сообщения */}
          <div className={styles.chatMessages}>
            {messages.length === 0 ? (
              <div className={styles.noMessages}>
                <p>История сообщений пуста</p>
                <p>Напишите первое сообщение!</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={classNames(styles.message, {
                    [styles.supportMessage]: message.isFromSupport,
                    [styles.userMessage]: !message.isFromSupport
                  })}
                >
                  <div className={styles.messageContent}>
                    <p>{message.text}</p>
                    <span className={styles.messageTime}>
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                  {message.isFromSupport && (
                    <div className={styles.messageAuthor}>Поддержка</div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Поле ввода */}
          <form onSubmit={sendMessage} className={styles.chatInputForm}>
            <div className={styles.inputGroup}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Введите ваше сообщение..."
                className={styles.messageInput}
                disabled={!isConnected}
              />
              <button 
                type="submit" 
                className={styles.sendButton}
                disabled={!isConnected || !newMessage.trim()}
              >
              Отправить
              </button>
            </div>
            {!isConnected && (
              <p className={styles.connectionWarning}>
                Соединение отсутствует. Попробуйте обновить страницу.
              </p>
            )}
          </form>
        </div>
      )}
    </>
  );
}; 
