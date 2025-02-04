document.addEventListener("DOMContentLoaded", () => {
    const cursor = document.getElementById("cursor")
    const links = document.querySelectorAll("a")
    const video = document.getElementById("myVideo")
  
    // Cursor effect
    document.addEventListener("mousemove", (e) => {
      cursor.style.left = e.clientX + "px"
      cursor.style.top = e.clientY + "px"
    })
  
    links.forEach((link) => {
      link.addEventListener("mouseenter", () => {
        cursor.style.transform = "translate(-50%, -50%) scale(1.5)"
      })
      link.addEventListener("mouseleave", () => {
        cursor.style.transform = "translate(-50%, -50%) scale(1)"
      })
    })
  
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault()
        document.querySelector(this.getAttribute("href")).scrollIntoView({
          behavior: "smooth",
        })
      })
    })
  
    // Video background
    video.play().catch((error) => {
      console.log("Auto-play was prevented:", error)
      // You might want to add a play button here as a fallback
    })
  
    // Pause/play video when tab is inactive/active
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        video.pause()
      } else {
        video.play().catch((e) => console.log("Auto-play on tab focus was prevented:", e))
      }
    })
  
    // Update active link on scroll
    window.addEventListener("scroll", () => {
      const scrollPosition = window.scrollY
  
      document.querySelectorAll(".section").forEach((section) => {
        if (scrollPosition >= section.offsetTop - 200) {
          document.querySelectorAll(".left-panel nav a").forEach((link) => {
            link.classList.remove("active")
            if (link.getAttribute("href").substring(1) === section.id) {
              link.classList.add("active")
            }
          })
        }
      })
    })
  })
  
  document.addEventListener("DOMContentLoaded", function() {
    const circularProgresses = document.querySelectorAll(".circular-progress");

    circularProgresses.forEach(progress => {
        const progressValue = progress.querySelector(".progress-value");
        const progressEndValue = parseInt(progress.getAttribute("data-progress"));
        let speed = 20;

        const progressAnimation = setInterval(() => {
            const progressStartValue = parseInt(progressValue.textContent);
            if (progressStartValue >= progressEndValue) {
                clearInterval(progressAnimation);
            } else {
                progressValue.textContent = `${progressStartValue + 1}%`;
                progress.style.background = `conic-gradient(#1ed760 ${(progressStartValue + 1) * 3.6}deg, #e0e0e0 0deg)`; // Updated color
            }
        }, speed);
    });
}); 
