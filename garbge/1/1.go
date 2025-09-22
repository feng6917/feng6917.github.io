package main

import (
	"context"
	"fmt"
	"time"
)

func main() {
	ctx := context.Background()
	ctx1 := context.WithValue(ctx, "key", "value")
	ctx2 := context.WithValue(ctx1, "key1", "value1")
	ctx3 := context.WithValue(ctx2, "key2", "value2")
	v3 := ctx3.Value("key")
	fmt.Println(v3)
	ctx4, cancel := context.WithTimeout(ctx, time.Second*4)
	time.Sleep(time.Second * 1)
	cancel()
	time.Sleep(time.Second * 1)

	go func() {
		switch ctx4.Err() {
		case context.DeadlineExceeded:
			fmt.Println("deadline exceeded")
		case context.Canceled:
			fmt.Println("context canceled")
		default:
			fmt.Println("unknown error")
		}
	}()
	time.Sleep(time.Second * 1)
}

func foo() {
	var i interface{} = 1
	fmt.Println(i)
}
