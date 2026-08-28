---
layout: post
title: "面试"
date:   2018-8-28
permalink: /tool-interview/
tags: 
  - 工具类
comments: false
author: feng6917
---

本文档为面试资料，打开页面后需输入密码方可查看。

<!-- more -->

<div id="interview-gate" style="display:none">

this is my interview

</div>

<script>
(function () {
  var STORAGE_KEY = 'tool-interview-unlocked';
  var PASSWORD = 'myz17521';
  var gate = document.getElementById('interview-gate');

  function unlock() {
    if (gate) gate.style.display = 'block';
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
  }

  function deny() {
    alert('三次机会已用完，即将返回上一页！');
    history.go(-1);
  }

  if (gate && sessionStorage.getItem(STORAGE_KEY) === '1') {
    unlock();
    return;
  }

  var attempts = 0;
  var pass = prompt('请输入访问密码：', '');

  while (attempts < 3) {
    if (!pass) {
      history.go(-1);
      return;
    }
    if (pass === PASSWORD) {
      unlock();
      return;
    }
    attempts += 1;
    if (attempts === 1) {
      pass = prompt('密码错误，还剩两次机会。');
    } else if (attempts === 2) {
      pass = prompt('密码错误，还剩一次机会。');
    }
  }

  if (pass !== PASSWORD && attempts === 3) {
    deny();
  }
})();
</script>
