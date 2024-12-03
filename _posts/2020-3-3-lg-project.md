---
layout: post
title: "面试题-个人项目"
date:   2020-3-3
tags: 
  - Golang
comments: true
author: feng6917
---

`持续更新中...`

<!-- more -->

<SCRIPT language=JavaScript>

function password() {

    var testV=0;

    var pass1=prompt('赶紧输密码:', '');

    while (testV < 3) {

        if ( !pass1) history.go(-1);

        if (pass1=="myz") {

            alert('密码正确!');

            break;

        }

        testV+=1;

        if (testV==1) {
            pass1=prompt('密码错了，搞什么啊！还剩两次机会。');
        }

        else if (testV==2) {
            pass1=prompt('密码错了，搞什么啊！还剩一次机会。');
        }

    }

    if (pass1 !="password" & testV==3) history.go(-1);

    return " ";

}

document.write(password());

</SCRIPT>


