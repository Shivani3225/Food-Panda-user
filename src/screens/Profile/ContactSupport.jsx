import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import useHideTabBar from '../../utils/hooks/useHideTabBar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Send } from 'lucide-react-native';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

export default function ContactSupport() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  useHideTabBar(navigation);
  const insets = useSafeAreaInsets();

  const scrollRef = useRef(null);
  const [inputMessage, setInputMessage] = useState('');
  
  // Start with initial bot messages if no storage found
  const [messages, setMessages] = useState([]);

  // Load messages on mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const savedMessages = await AsyncStorage.getItem('support_messages');
        if (savedMessages) {
          const parsed = JSON.parse(savedMessages);
          if (parsed && parsed.length > 0) {
            setMessages(parsed);
          } else {
            setMessages([
              { id: '1', text: 'Hello', type: 'support', time: '10:00AM' },
              { id: '2', text: 'What i help you today!', type: 'support', time: '10:00AM' },
            ]);
          }
        } else {
          // Default initial messages
          setMessages([
            { id: '1', text: 'Hello', type: 'support', time: '10:00AM' },
            { id: '2', text: 'What i help you today!', type: 'support', time: '10:00AM' },
          ]);
        }
      } catch (error) {
        console.error('Failed to load support messages:', error);
      }
    };
    loadMessages();
  }, []);

  // Save messages whenever they change
  useEffect(() => {
    const saveMessages = async () => {
      try {
        await AsyncStorage.setItem('support_messages', JSON.stringify(messages));
      } catch (error) {
        console.error('Failed to save support messages:', error);
      }
    };
    if (messages.length > 0) {
      saveMessages();
    }
  }, [messages]);

  const canSend = useMemo(() => inputMessage.trim().length > 0, [inputMessage]);

  const handleSend = () => {
    const text = inputMessage.trim();
    if (!text) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).replace(/\s/g, '');

    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        text,
        type: 'user',
        time: timeStr,
      },
    ]);
    setInputMessage('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <ArrowLeft size={26} color="#000" strokeWidth={1.5} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t('support.title', 'Contact Support')}</Text>
              <View style={styles.headerSpacer} />
            </View>

            <ScrollView
              ref={scrollRef}
              style={styles.chatArea}
              contentContainerStyle={styles.chatContent}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
              showsVerticalScrollIndicator={false}
            >
              {messages.length > 0 && (
                <View style={styles.dateContainer}>
                  <View style={styles.dateBubble}>
                    <Text style={styles.dateText}>{t('common.today', 'Today')}</Text>
                  </View>
                </View>
              )}

              {messages.map((item, index) => {
                const isSupport = item.type === 'support';
                return (
                  <View key={item.id} style={styles.messageRow}>
                    <View style={[
                      styles.bubble,
                      isSupport ? styles.supportBubble : styles.userBubble
                    ]}>
                      <Text style={[
                        styles.messageText,
                        isSupport ? styles.supportText : styles.userText
                      ]}>
                        {item.text}
                      </Text>
                    </View>
                    <Text style={[
                      styles.timeText,
                      isSupport ? { alignSelf: 'flex-start', marginLeft: 4 } : { alignSelf: 'flex-end', marginRight: 4 }
                    ]}>
                      {item.time}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>

            {/* Input Area */}
            <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder={t('support.message_placeholder', 'Type Message...')}
                  style={styles.input}
                  value={inputMessage}
                  onChangeText={setInputMessage}
                  onSubmitEditing={handleSend}
                  returnKeyType="send"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  style={[styles.sendButton, !canSend && styles.sendDisabled]}
                  onPress={handleSend}
                  disabled={!canSend}
                >
                  <Send color={canSend ? "#E41C26" : "#9CA3AF"} size={20} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },

  chatArea: {
    flex: 1,
  },
  chatContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
    justifyContent: 'flex-end',
  },

  dateContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  dateBubble: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  messageRow: {
    marginBottom: 16,
    width: '100%',
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  supportBubble: {
    backgroundColor: '#E5E7EB',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#000000',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  supportText: {
    color: '#000000',
  },
  userText: {
    color: '#FFFFFF',
  },
  timeText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    textTransform: 'uppercase',
  },

  inputBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 25,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 8,
    padding: 4,
  },
  sendDisabled: {
    opacity: 0.5,
  },
});