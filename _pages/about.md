---
permalink: /
title: "Welcome to Peilin's Web"
excerpt: ""
author_profile: true
redirect_from: 
  - /about/
  - /about.html
---

{% if site.google_scholar_stats_use_cdn %}
{% assign gsDataBaseUrl = "https://cdn.jsdelivr.net/gh/" | append: site.repository | append: "@" %}
{% else %}
{% assign gsDataBaseUrl = "https://raw.githubusercontent.com/" | append: site.repository | append: "/" %}
{% endif %}
{% assign url = gsDataBaseUrl | append: "google-scholar-stats/gs_data_shieldsio.json" %}

<span class='anchor' id='about-me'></span>

My name is Peilin Feng (冯沛林), and my English name is **Albert Von**. I chose it because I hope to become a great scientist like [Albert Einstein](https://en.wikipedia.org/wiki/Albert_Einstein), the physicist, and [Albert Gu](https://csd.cmu.edu/people/faculty/albert-gu), whose work on state-space models brought an idea from control theory into modern sequence modelling.

I am a PhD student at **Nanyang Technological University (NTU)**, in the [DeCLaRe Lab](https://declare-lab.github.io/) supervised by Prof. [Soujanya Poria](https://soujanyaporia.github.io/). My research interest comes from one goal: I want to build an intelligent robot like Doraemon 🐱. On the way there, I work on LLM agents and multi-agent systems: whom an agent should trust, when it should consult others, and how it can learn from verified experience. [BaRe-Mem](https://arxiv.org/abs/2609.35551) is my latest step in that direction.

Before NTU, I received my bachelor's degree from **Beihang University** (2021-2025), majoring in Automation Science and Electrical Engineering with a minor in Mathematical Sciences, where I worked with [Prof. Lei Huang](https://huangleibuaa.github.io/) on neural network architecture design and multimodal understanding. I have also interned at the Shanghai AI Lab and at Zhipu AutoGLM, working on agents for Earth observation, synthetic image detection and GUI agents.

I have a deep passion for mathematics, and I served as a teaching assistant for Mathematical Analysis at Beihang, grading homework, answering students' questions and leading review lectures. Outside research, I enjoy playing ping pong 🏓 and swimming 🤿, listening to music 🎵 and watching my favourite cartoon, Doraemon 📺.
<!--(You can also use google scholar badge <a href='https://scholar.google.com/citations?user=DhtAFkwAAAAJ'><img src="https://img.shields.io/endpoint?url={{ url | url_encode }}&logo=Google%20Scholar&labelColor=f6f6f6&color=9cf&style=flat&label=citations"></a>).-->


# 🔥 News
- *2026.09*: &nbsp;🔥🔥 We release <font color=CornflowerBlue>BaRe-Mem</font> <font color=MediumVioletRed>(First Author)</font>, a Bayesian reliability memory for robust and adaptive agent consultation. Check out the [paper](https://arxiv.org/abs/2609.35551), [code](https://github.com/declare-lab/BaRe-Mem) and [project page](https://huggingface.co/spaces/Sssunset/BaRe-Mem)!
- *2026.05*: &nbsp;🎉🎉 I am excited to join in [Declare Lab @ NTU](https://declare-lab.github.io/) supervised by Prof. [Soujanya Poria](https://scholar.google.co.in/citations?hl=en&user=oS6gRc4AAAAJ&view_op=list_works) to persue my PhD degree. Great new journey!
- *2026.02*: &nbsp;😊😊 I am excited to intern at **<font color=MediumOrchid>Zhipu AutoGLM</font>**<font color=CadetBlue>@Beijing</font> from Feb. 2026, focusing on GUI-Agent and Post-training. Feel to have a  <font color=Peru>coffee chat</font> with me!
- *2026.01*: &nbsp;🎉🎉 Our Paper <font color=CornflowerBlue>Earth-Agent</font> <font color=MediumVioletRed>(First Author)</font> was accepted at <font color=Crimson>ICLR (Poster)</font>!
- *2025.09*: &nbsp;🎉🎉 Our paper <font color=CornflowerBlue>Spot the Fake</font> <font color=MediumVioletRed>(Second Author)</font> was accepted at <font color=Crimson>NeurIPS (Poster)</font>.
- *2025.06*: &nbsp;🎓🎓 I reveived my bachelor's degree at Beihang University, thanks to my teachers and friends, miss you!
- *2025.06*: &nbsp;🎉🎉 Our paper <font color=CornflowerBlue>LEGION</font> was accepted at <font color=Crimson>ICCV (Highlight)</font>.
- *2025.01*: &nbsp;😊😊 I am excited to gain the opportunity to intern with the Multimodal Group at the **<font color=PaleVioletRed>Shanghai National AI Lab</font>** from Feb. 2025. I look forward to collaborating with like-minded mentors and peers on interesting and meaningful work.

<!--
- *2024.12*: &nbsp;😭😭 My first paper to ICLR 2025 was unfortunately rejected. While it's true that most people's first submission is full of ups and downs, I still feel quite heartbroken. I hope my revised version will stand out at ICML. Fighting💪!
- *2024.10*: &nbsp;🎉🎉 I successfully submitted my first paper to ICLR 2025 <font color=MediumVioletRed>(First Author)</font>, marking a milestone to my research career. I hope I will be more excellent in the future.
-->

# 📝 Publications
<div class='paper-box'><div class='paper-box-image'><div><div class="badge">Arxiv</div><img src='images/paper/BaRe-Mem.png' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

[BaRe-Mem: Bayesian Reliability Memory for Robust and Adaptive Agent Consultation](https://arxiv.org/pdf/2609.35551)

**Peilin Feng**, Zhengyang Huang, Soujanya Poria<sup>✉</sup>

# 💡 Contribution [![Project Page](https://img.shields.io/badge/Project-Page-2a6fc4)](https://huggingface.co/spaces/Sssunset/BaRe-Mem) [![Dataset](https://img.shields.io/badge/%F0%9F%A4%97%20Hugging%20Face-Dataset-yellow)](https://huggingface.co/datasets/Sssunset/BaRe-Mem-Data) [![GitHub Stars](https://img.shields.io/github/stars/declare-lab/BaRe-Mem?style=social)](https://github.com/declare-lab/BaRe-Mem)
- We propose BaRe-Mem, an online Bayesian reliability memory for multi-agent consultation that estimates advisor reliability from the central model's internal belief representations and updates it from verified outcomes.
- The reliability estimates modulate the influence of advisor responses and decide between consultation and autonomous reasoning.
- Across nine benchmarks and six central models, BaRe-Mem is more robust to misleading advisors than debate and majority voting, and it improves worker allocation in agent teams on MuSiQue.
</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">ICLR 2026</div><img src='images/paper/Earth-Agent.jpg' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1">
<!-- <div class='paper-box'><div class='paper-box-image'><div><div class="badge">ICLR 2026</div><img src='images/paper/fakevlm.jpg' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1"> -->
[Earth-Agent: Unlocking the Full Landscape of Earth Observation with Agents](https://arxiv.org/pdf/2509.23141)

**Peilin Feng**<sup>†</sup>, Zhutao Lv<sup>†</sup>, Junyan Ye, Xiaolei Wang, Xinjie Huo, Jinhua Yu, Wanghan Wu, Wenlong Zhang, Lei Bai, Conghui He, Weijia Li<sup>✉</sup>

# 💡 Contribution [<img src="images/earthagent.png" alt="Project" style="width:25px; height:auto;">](https://opendatalab.github.io/Earth-Agent/) [![Dataset](https://img.shields.io/badge/%F0%9F%A4%97%20Hugging%20Face-Dataset-yellow)](https://huggingface.co/datasets/Sssunset/Earth-Bench) [![GitHub Stars](https://img.shields.io/github/stars/opendatalab/Earth-Agent?style=social)](https://github.com/opendatalab/Earth-Agent/) [![Report](https://img.shields.io/badge/WeChat-%40%E6%9C%BA%E5%99%A8%E4%B9%8B%E5%BF%83-black%3Flogo%3Dwechat%26amp%3BlogoColor%3D07C160)](https://mp.weixin.qq.com/s/-rOj8w2Gv4Lf9baIJyoGoA)
- We propose Earth-Agent, a revolutionary paradigm shift from traditional MLLMs to agentic EO analysis, unifying RGB and spectral EO data within an MCP-based tool ecosystem
- In order to comprehensivly evaluate Earth-Agent, we propose Earth-Bench, which covers *Spectrum*, *Products* and *RGB* modality for scientific workflows requring tool interaction,
- Earth-Agent substantially outperforms general agents and surpasses remote sensing MLLMs on remote sensing benchmarks, demonstrating both effectiveness and potential for advancing EO research
</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">NeurIPS 2025</div><img src='images/paper/fakevlm.jpg' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1">
<!-- <div class='paper-box'><div class='paper-box-image'><div><div class="badge">ICCV 4,2,1</div><img src='images/paper/fakevlm.jpg' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1"> -->
[Spot the Fake: Large Multimodal Model-Based Synthetic Image Detection with Artifact Explanation](https://arxiv.org/pdf/2503.14905)

Siwei Wen<sup>†</sup>, Junyan Ye<sup>†</sup>, **Peilin Feng**, Hengrui Kang, Zichen Wen, Yize Chen, Jiang Wu, Wenjun Wu, Conghui He, Weijia Li<sup>✉</sup>

# 💡 Contribution [![Dataset](https://img.shields.io/badge/%F0%9F%A4%97%20Hugging%20Face-Dataset-yellow)](https://huggingface.co/datasets/lingcco/FakeClue) [![GitHub Stars](https://img.shields.io/github/stars/opendatalab/FakeVLM?style=social)](https://github.com/opendatalab/FakeVLM/)
- Introduced FakeClue, a comprehensive dataset containing over 100,000 synthetic and real images across seven categories, annotated with fine-grained artifact clues in natural language.
- Proposed FakeVLM, a specialized large multimodal model for synthetic image and DeepFake detection, combining authenticity classification with natural language explanations of image artifacts.
</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">ICCV Highlight</div><img src='images/paper/legion.png' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1">
<!-- <div class='paper-box'><div class='paper-box-image'><div><div class="badge">ICCV 5,4,4</div><img src='images/paper/legion.png' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1"> -->
[LEGION: Learning to Ground and Explain for Synthetic Image Detection](https://arxiv.org/pdf/2503.15264) 

Hengrui Kang<sup>†</sup>, Siwei Wen<sup>†</sup>, Zichen Wen<sup>†</sup>, Junyan Ye, Weijia Li<sup>✉</sup>, **Peilin Feng**, Baichuan Zhou, Bin Wang, Dahua Lin, Linfeng Zhang, Conghui He<sup>✉</sup>

# 💡 Contribution [![Dataset](https://img.shields.io/badge/%F0%9F%A4%97%20Hugging%20Face-Dataset-yellow)](https://huggingface.co/datasets/khr0516/SynthScars) [![GitHub Stars](https://img.shields.io/github/stars/opendatalab/LEGION?style=social)](https://github.com/opendatalab/LEGION/)
- Introduced SynthScars, a high-quality synthetic image detection dataset featuring diverse content types, fine-grained pixel-level artifact annotations, and detailed textual explanations.
- Proposed LEGION: a multimodal large language model-based framework for artifact localization, explanation generation, and forgery detection, enhancing interpretability in synthetic image analysis.
</div>
</div>


<!-- <div class='paper-box'><div class='paper-box-image'><div><div class="badge"></div><img src='images/paper/Normalization in Mamba.png' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1"> -->
<!-- <div class='paper-box'><div class='paper-box-image'><div><div class="badge">ICML 3,2,2,2</div><img src='images/paper/Normalization in Mamba.png' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1"> -->

<!-- [Layer-Wise Analysis in Exploring the Normalization Strategies in Mamba](./profiles/paper/Mamba.pdf) -->

<!-- **Peilin Feng**, Yuanshuai Wang, Yunhao Ni, Junle Wang, zhangkui, Wenjun Wu, Lei Huang<sup>✉</sup> -->

<!-- # 💡 Contribution
- We track the spectral norms and singular values of covariance matrices in Mamba to demonstrate the critical role of Norm2 in stability.
- We track the condition number of K-FAC in Mamba to demonstrate the critical role of Norm1 in improving optimization.
- We proposed a composite normalization strategy and evaluate its effectiveness across diverse tasks,including sequence modeling, NLP & CV -->
<!-- </div>
</div> -->



# 🎖 Honors and Awards
- *2025.06* Outstanding undergraduate graduate of Beihang University(top3%)
- *2024.12* Grand prize for Contests Scholarship in Beihang University
- *2023.12* Outstanding student cadres
- *2023.12* First Prize in the Chinese Mathematics Competition
- *2023.12* First Prize in Beijing Mathematics Competition (114th among 20000+ students)
- *2023.12* Second Prize for Contests Scholarship in Beihang University
- *2023.12* Second Prize in China Undergraduate Mathematical Contest in Modeling
- *2023.09* Outstanding Teaching Assistant in Mathematical Analysis(6/32)
- *2023.06* Second Prize in Qixian Cup Robot Challenge Competition(4/32)
- *2022.12* First Prize Scholarship in Beihang University (top5%)
- *2022.06* Second Prize in Feng Ru Cup Science and Technology Innovation Competition


# 📖 Educations

- *2026.08 - 2030.06*, School of Electrical and Electronic Engineering, NTU, Singarpore. 
- *2021.09 - 2025.06*, Automation Science, Beihang University, Beijing, China.

# 💬 Tutorial Materials in Teaching Assistant

## 🎤 Lectures:
- *2022.11*,&nbsp;&nbsp;Tutorial, Mathematical Analysis: Indefinite Integral.  \| [\[video\]](https://m.weibo.cn/detail/4840358561187594)
- *2022.10*,&nbsp;&nbsp;Tutorial, Mathematical Analysis: Equivalent Transform.  \| [\[video\]](https://m.weibo.cn/detail/4825133950703651)
- *2022.09*,&nbsp;&nbsp;Tutorial, Mathematical Analysis: Limit in Recursion sequence.  \| [\[video\]](https://m.weibo.cn/detail/4817158976309764)
- *2021.12*,&nbsp;&nbsp;Tutorial, Mathematical Analysis: Integration by parts. \| [\[video\]](https://www.bilibili.com/video/BV1Va411k7Hf/?spm_id_from=333.999.0.0&vd_source=6a5aa1ac5ba5c7ca5c6bc79c1f65e5af)
- *2021.11*,&nbsp;&nbsp;Tutorial, Mathematical Analysis: Rolle's theorem. \| [\[video\]](https://www.bilibili.com/video/BV1UM4y1P755/?spm_id_from=333.999.0.0&vd_source=6a5aa1ac5ba5c7ca5c6bc79c1f65e5af)

## 📄 Test:
- *2022.10*,&nbsp;&nbsp;Mock Mid-term Exam, Mathematical Analysis(I) \| [\[Test\]](./profiles/Test/MathematicalAnalysis(I)Test.pdf) & \| [\[Answer\]](./profiles/Test/MathematicalAnalysis(I)Answer.pdf)
- *2023.04*,&nbsp;&nbsp;Mock Mid-term Exam, Mathematical Analysis(II) \| [\[Test\]](./profiles/Test/MathematicalAnalysis(II)Test.pdf) & \| [\[Answer\]](./profiles/Test/MathematicalAnalysis(II)Answer.pdf)

# 📒 Inspiration Notes
- *2026.10*: &nbsp;[Mathematical Intuition Behind BaRe-Mem](/notes/bare-mem/). The mathematics behind our Bayesian reliability memory.

# 💻 Internships
<div class='paper-box'><div class='paper-box-image'><div><img src='images/Internship/zhipu.png' alt="ZHIPU" width="30%" style="margin-bottom: 0;"></div></div>
<div class='paper-box-text' markdown="1" style="margin-top: -20px; margin-left: -15em;">

- *2026.02 - Present*, [Zhipu AutoGLM](https://www.zhipuai.cn/zh/research/145), Beijing, China.
</div>
</div>
<div class='paper-box'><div class='paper-box-image'><div><img src='images/Internship/shlab.png' alt="SHLAB" width="40%" style="margin-bottom: 0;"></div></div>
<div class='paper-box-text' markdown="1" style="margin-top: -20px; margin-left: -15em;">

- *2025.02 - 2025.08*, [Shanghai National AI Lab](https://www.shlab.org.cn/), Shanghai, China.
</div>
</div>

<!-- <div class='paper-box'><div class='paper-box-image'><div><img src='images/Internship/cast.png' alt="CAST" width="40%" style="margin-bottom: 0;"></div></div>
<div class='paper-box-text' markdown="1" style="margin-top: -20px; margin-left: -15em;"> -->

<!-- - *2024.07 - 2024.09*, [China Academy of Space Technology](https://www.cast.cn/), Beijing, China.
</div>
</div> -->


# ✏️ Community Service
- Conference Reviewer: AAAI, ICLR, Neurips
<script type="text/javascript" id="mapmyvisitors" src="https://mapmyvisitors.com/map.js?d=zPzVmHbYMKiKoDeQ37f2Y60SWu9aiDwmXLD4moLgquc&cl=ffffff&w=200"></script>


