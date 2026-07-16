"use client";

import React, { useEffect, useState, useRef } from 'react';
import { getOrderChat, sendMessage } from '@/lib/api';
import type { OrderChatResponseDto } from 'event-types';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Send, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface OrderChatProps {
  orderId: string;
  currentStatus: string;
  currentUserId?: string;
}

const CLOSED_STATUSES = ['CANCELED', 'DELIVERED', 'REFUNDED'];

export function OrderChat({ orderId, currentStatus, currentUserId }: OrderChatProps) {
  const [messages, setMessages] = useState<OrderChatResponseDto[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isChatClosed = CLOSED_STATUSES.includes(currentStatus);

  const fetchMessages = async () => {
    try {
      const data = await getOrderChat(orderId);
      // Ensure messages are sorted by date oldest first
      const sorted = data.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
      setMessages(sorted);
    } catch (error) {
      console.error("Error al cargar el chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Optional: Poll every 10 seconds for new messages if the chat isn't closed
    if (!isChatClosed) {
      const interval = setInterval(fetchMessages, 10000);
      return () => clearInterval(interval);
    }
  }, [orderId, isChatClosed]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isChatClosed || isSending) return;

    try {
      setIsSending(true);
      const msg = await sendMessage({ orderId, message: newMessage });
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
    } catch (error: any) {
      toast({ title: "Error", description: "No se pudo enviar el mensaje.", variant: "error" });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card padding="none" className="flex flex-col flex-1 min-h-[400px] border border-gray-200 shadow-sm overflow-hidden bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <h3 className="font-bold text-slate-900">Mensajes del Pedido</h3>
        {isChatClosed && (
          <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-1 rounded flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Chat Cerrado
          </span>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1 bg-gray-50/30">
        {isLoading ? (
          <div className="text-center text-sm text-gray-500 py-4">Cargando mensajes...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-8">
            No hay mensajes aún. Escribe algo para comenzar.
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === currentUserId;
            const isSameAsPrev = index > 0 && messages[index - 1].senderId === msg.senderId;
            const isSameAsNext = index < messages.length - 1 && messages[index + 1].senderId === msg.senderId;

            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${!isSameAsPrev ? 'mt-3' : ''}`}
              >
                <div className="flex items-end gap-2 max-w-[80%]">
                  {!isMe && (
                    <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                      {!isSameAsNext ? (
                        <div className="w-full h-full rounded-full bg-brand-primary/10 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-brand-primary">
                            {msg.sender?.fullName?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </div>
                  )}
                  
                  <div className={`
                    px-3 py-2 text-sm shadow-sm flex flex-col relative
                    ${isMe 
                      ? `bg-brand-primary text-white rounded-tl-2xl rounded-bl-2xl ${!isSameAsPrev ? 'rounded-tr-2xl' : 'rounded-tr-sm'} ${!isSameAsNext ? 'rounded-br-2xl' : 'rounded-br-sm'}` 
                      : `bg-white border border-gray-100 text-slate-700 rounded-tr-2xl rounded-br-2xl ${!isSameAsPrev ? 'rounded-tl-2xl' : 'rounded-tl-sm'} ${!isSameAsNext ? 'rounded-bl-2xl' : 'rounded-bl-sm'}`}
                  `}>
                    <span>{msg.message}</span>
                    <span className={`text-[9px] text-right mt-0.5 ${isMe ? 'text-white/80' : 'text-gray-400'}`}>
                      {format(new Date(msg.sentAt), "HH:mm")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-gray-100 bg-white">
        {isChatClosed ? (
          <div className="p-3 bg-gray-50 text-center text-sm text-gray-500 rounded-lg">
            El chat ha sido deshabilitado porque la orden está en estado {currentStatus}.
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                placeholder="Escribe un mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={isSending}
                className="bg-gray-50 border-gray-200"
              />
            </div>
            <Button 
              type="submit" 
              variant="primary" 
              className="px-4 shrink-0 rounded-xl"
              disabled={!newMessage.trim() || isSending}
              isLoading={isSending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        )}
      </div>
    </Card>
  );
}
