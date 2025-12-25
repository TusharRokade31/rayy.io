import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {aiAdvisorService} from '../../services/api';
import {colors} from '../../theme';
import {useAuth} from '../../context/AuthContext';

const AIAdvisorScreen = ({navigation, route}) => {
  const {user} = useAuth();
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your AI advisor. I can help you find the perfect classes for your children. What would you like to know?`,
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const flatListRef = useRef();

  // If coming from listing detail, ask about that listing
  useEffect(() => {
    if (route.params?.listingInfo) {
      const listing = route.params.listingInfo;
      handleQuickAction(`Tell me about ${listing.title}`);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await aiAdvisorService.chat(inputText, sessionId);
      
      if (!sessionId) {
        setSessionId(response.data.session_id);
      }

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: response.data.response,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (question) => {
    const userMessage = {
      id: Date.now().toString(),
      text: question,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await aiAdvisorService.chat(question, sessionId);
      
      if (!sessionId) {
        setSessionId(response.data.session_id);
      }

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: response.data.response,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({item}) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === 'user' ? styles.userMessage : styles.aiMessage,
      ]}>
      {item.sender === 'ai' && (
        <View style={styles.aiAvatar}>
          <Icon name="robot" size={20} color="white" />
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          item.sender === 'user'
            ? styles.userMessageBubble
            : styles.aiMessageBubble,
        ]}>
        <Text
          style={[
            styles.messageText,
            item.sender === 'user' && styles.userMessageText,
          ]}>
          {item.text}
        </Text>
      </View>
    </View>
  );

  const quickActions = [
    {icon: 'palette', text: 'Art classes for 5-year-old'},
    {icon: 'run', text: 'Sports activities for kids'},
    {icon: 'music', text: 'Music lessons available'},
    {icon: 'sparkles', text: 'Trial classes near me'},
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>AI Advisor</Text>
          <Text style={styles.headerSubtitle}>Ask me anything about classes</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
      />

      {messages.length === 1 && (
        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsTitle}>Try asking:</Text>
          <View style={styles.quickActions}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionButton}
                onPress={() => handleQuickAction(action.text)}>
                <Icon name={action.icon} size={16} color={colors.primary} />
                <Text style={styles.quickActionText}>{action.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Ask about classes..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSendMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || loading) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || loading}>
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Icon name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  userMessageBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  aiMessageBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  userMessageText: {
    color: 'white',
  },
  quickActionsContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  quickActionText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  inputContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default AIAdvisorScreen;
