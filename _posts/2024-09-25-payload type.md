---
layout: post
date: 2024-09-25
title: RTP中的Payload Type
categories: tech_coding
tags:
  - codec
---

这是我在工作中日日打交道的一个小常识， 今天找一下相关的文献整理一下。

### 什么是Payload Type？
**Payload Type** 是RTP协议中用于标识数据类型的一个字段。它就像一个标签，告诉接收方收到的RTP数据包中携带的数据是什么类型的，以便接收方能够正确地解码和处理这些数据。

### Payload Type的作用
* **选择解码器：** 接收方根据Payload Type选择相应的解码器。
* **提供编解码信息：** Payload Type 还可以包含关于编解码的附加信息，如采样率、比特率等。

### Payload Type的分配
Payload Type 可以分为静态分配和动态分配两种：
* **静态分配：** 一些常用的编解码格式（如G.711）的Payload Type是预先定义好的。
* **动态分配：** 对于新的或不常见的编解码格式，可以动态分配Payload Type。RFC 3551中规定了动态分配的Payload Type范围(96-127)。
* RFC35551中的table4详细规定了哪一种codec用哪一个静态分配的Paylaod Type以及哪些codec是可以用动态分配的payload type。

### SDP中的Payload Type
* **静态Payload Type：** 在SDP中，静态Payload Type通常直接用数字表示。
    ```
    m=audio 4917 RTP/AVP 0
    a=rtpmap:0 PCMU/8000
    ```
* **动态Payload Type：** 对于动态Payload Type，SDP中除了包含Payload Type编号外，还需要使用`a=fmtp`属性来描述该Payload Type所对应的编解码格式。
    ```
    m=video 9 RTP/AVP 96
    a=rtpmap:96 H264/90000
    a=fmtp:96 packetization-mode=1;profile-level-id=42e01f
    ```

**Reference**

1. RFC 3550 - RTP: A Transport Protocol for Real-time Applications

2. RFC 3551 - RTP Profile for Audio and Video Conferences with Minimal Control