import 'package:flutter/material.dart';

import 'package:go_router/go_router.dart';



import '../../data/chat_repository.dart';

import '../../domain/active_chat_context.dart';

import '../widgets/chat_empty_state.dart';

import '../widgets/chat_order_banner.dart';

import '../widgets/chat_thread_body.dart';



class ChatThreadPage extends StatefulWidget {

  const ChatThreadPage({super.key, required this.conversationId});



  final String conversationId;



  @override

  State<ChatThreadPage> createState() => _ChatThreadPageState();

}



class _ChatThreadPageState extends State<ChatThreadPage> {

  final _repo = ChatRepository();

  ActiveChatContext? _context;

  bool _loading = true;



  @override

  void initState() {

    super.initState();

    _load();

  }



  Future<void> _load() async {

    final ctx = await _repo.fetchThreadContext(widget.conversationId);

    if (mounted) {

      setState(() {

        _context = ctx;

        _loading = false;

      });

    }

  }



  @override

  Widget build(BuildContext context) {

    if (_loading) {

      return const Scaffold(body: Center(child: CircularProgressIndicator()));

    }



    final chat = _context;

    if (chat == null) {

      return const Scaffold(

        body: ChatEmptyState(variant: ChatEmptyVariant.noActiveOrder),

      );

    }



    final canSend = ActiveChatContext.orderAllowsChat(chat.order);



    return Scaffold(

      body: Column(

        children: [

          ChatHeaderBar(

            conversation: chat.conversation,

            showBack: true,

            onBack: () => context.pop(),

          ),

          ChatOrderBanner(activeChat: chat),

          Expanded(

            child: ChatThreadBody(

              conversationId: chat.conversation.id,

              readOnly: !canSend,

              readOnlyHint: ActiveChatContext.chatBlockReason(chat.order),

            ),

          ),

        ],

      ),

    );

  }

}


