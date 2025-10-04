import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { 
  ChevronRight, Heart, Target, Sparkles, Star, Calendar, 
  User, Users, Crown, Zap, Scale, Dumbbell, Shield, 
  Clock, MapPin, Timer, Eye, Shirt, MessageCircle, Battery,
  Trophy, Gift, PartyPopper
} from 'lucide-react';

interface OnboardingProps {
  onComplete: (data: any) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    ageGroup: '',
    experience: '',
    goal: '',
    barriers: [] as string[],
    targetAreas: [] as string[],
    frequency: '',
    schedule: [] as string[],
    duration: '',
    motivation: '',
    height: '',
    weight: ''
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: string, item: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].includes(item)
        ? (prev[field as keyof typeof prev] as string[]).filter((i: string) => i !== item)
        : [...(prev[field as keyof typeof prev] as string[]), item]
    }));
  };

  const handleNext = () => {
    if (step < 9) {
      setStep(step + 1);
    } else if (step === 9) {
      // すべての質問が完了 → 完了画面へ遷移しつつデータを返す
      setStep(10);
      onComplete(formData);
    } else {
      onComplete(formData);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return true; // welcome screen
      case 1: return formData.ageGroup && formData.experience;
      case 2: return formData.goal;
      case 3: return true; // barriers can be empty
      case 4: return formData.targetAreas.length > 0;
      case 5: return formData.frequency;
      case 6: return formData.schedule.length > 0;
      case 7: return formData.duration;
      case 8: return formData.motivation;
      case 9: return true; // 身長・体重は任意入力（文言に合わせて通過可）
      default: return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="text-center space-y-8">
            <div className="relative">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-pink-400 via-rose-400 to-orange-400 rounded-full flex items-center justify-center shadow-2xl">
                <Heart className="w-16 h-16 text-white" strokeWidth={1.5} />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl text-pink-800 leading-relaxed">
                あなたに合った<br />
                プランを作ります！
              </h1>
              <p className="text-pink-600 text-lg">
                簡単な質問に答えて、<br />
                理想の体づくりを始めましょう
              </p>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg mb-4">
                <User className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl text-pink-800 mb-2">あなたの運動スタイルを教えてください</h2>
              <p className="text-pink-600">年代と経験を選んでね</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-pink-800 text-lg">年代</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: '20代', icon: Star, gradient: 'from-pink-400 to-rose-400' },
                    { id: '30代', icon: Crown, gradient: 'from-purple-400 to-pink-400' },
                    { id: '40代〜', icon: Trophy, gradient: 'from-orange-400 to-pink-400' }
                  ].map((age) => {
                    const Icon = age.icon;
                    return (
                      <Card 
                        key={age.id}
                        className={`cursor-pointer transition-all ${
                          formData.ageGroup === age.id 
                            ? 'bg-pink-100 border-pink-300 scale-105 shadow-lg' 
                            : 'bg-white border-pink-100 hover:bg-pink-50'
                        }`}
                        onClick={() => updateFormData('ageGroup', age.id)}
                      >
                        <CardContent className="p-4 text-center">
                          <div className={`w-12 h-12 mx-auto bg-gradient-to-br ${age.gradient} rounded-full flex items-center justify-center mb-2`}>
                            <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                          </div>
                          <span className="text-pink-800">{age.id}</span>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-pink-800 text-lg">運動経験</h3>
                <div className="space-y-3">
                  {[
                    { id: '初心者', icon: Sparkles, gradient: 'from-green-400 to-blue-400', label: '初心者' },
                    { id: 'ときどき', icon: Zap, gradient: 'from-yellow-400 to-orange-400', label: 'ときどき' },
                    { id: '経験者', icon: Dumbbell, gradient: 'from-red-400 to-pink-400', label: '経験者' }
                  ].map((exp) => {
                    const Icon = exp.icon;
                    return (
                      <Card 
                        key={exp.id}
                        className={`cursor-pointer transition-all ${
                          formData.experience === exp.id 
                            ? 'bg-pink-100 border-pink-300 shadow-lg' 
                            : 'bg-white border-pink-100 hover:bg-pink-50'
                        }`}
                        onClick={() => updateFormData('experience', exp.id)}
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className={`w-12 h-12 bg-gradient-to-br ${exp.gradient} rounded-full flex items-center justify-center`}>
                            <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                          </div>
                          <span className="text-pink-800 text-lg">{exp.label}</span>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg mb-4">
                <Target className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl text-pink-800 mb-2">どんな体になりたいですか？</h2>
              <p className="text-pink-600">目標を選んでね</p>
            </div>

            <div className="space-y-3">
              {[
                { id: 'slim', icon: Scale, gradient: 'from-blue-400 to-purple-400', label: 'スリムになりたい' },
                { id: 'tone', icon: Zap, gradient: 'from-pink-400 to-rose-400', label: '引き締めたい' },
                { id: 'muscle', icon: Dumbbell, gradient: 'from-orange-400 to-red-400', label: '筋肉をつけたい' },
                { id: 'healthy', icon: Heart, gradient: 'from-green-400 to-emerald-400', label: '健康維持' }
              ].map((goal) => {
                const Icon = goal.icon;
                return (
                  <Card 
                    key={goal.id}
                    className={`cursor-pointer transition-all ${
                      formData.goal === goal.id 
                        ? 'bg-pink-100 border-pink-300 scale-102 shadow-lg' 
                        : 'bg-white border-pink-100 hover:bg-pink-50'
                    }`}
                    onClick={() => updateFormData('goal', goal.id)}
                  >
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${goal.gradient} rounded-full flex items-center justify-center shadow-md`}>
                        <Icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                      </div>
                      <span className="text-pink-800 text-lg">{goal.label}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg mb-4">
                <Shield className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl text-pink-800 mb-2">避けたいことはありますか？</h2>
              <p className="text-pink-600">複数選択OK、なしでもOK</p>
            </div>

            <div className="space-y-3">
              {[
                { id: 'running', icon: Zap, gradient: 'from-red-400 to-orange-400', label: 'ランニングは嫌' },
                { id: 'heavy', icon: Dumbbell, gradient: 'from-gray-400 to-slate-400', label: '重いバーベルは嫌' },
                { id: 'gym', icon: MapPin, gradient: 'from-blue-400 to-indigo-400', label: 'ジムは行かない' },
                { id: 'long', icon: Clock, gradient: 'from-yellow-400 to-orange-400', label: '長時間は無理' }
              ].map((barrier) => {
                const Icon = barrier.icon;
                return (
                  <Card 
                    key={barrier.id}
                    className={`cursor-pointer transition-all ${
                      formData.barriers.includes(barrier.id) 
                        ? 'bg-pink-100 border-pink-300 shadow-lg' 
                        : 'bg-white border-pink-100 hover:bg-pink-50'
                    }`}
                    onClick={() => toggleArrayItem('barriers', barrier.id)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${barrier.gradient} rounded-full flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                        </div>
                        <span className="text-pink-800">{barrier.label}</span>
                      </div>
                      {formData.barriers.includes(barrier.id) && (
                        <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg mb-4">
                <Target className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl text-pink-800 mb-2">特に気になる部位は？</h2>
              <p className="text-pink-600">複数選択OK</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'abs', icon: Target, gradient: 'from-orange-400 to-red-400', label: 'お腹' },
                { id: 'legs', icon: Zap, gradient: 'from-blue-400 to-purple-400', label: '脚' },
                { id: 'hips', icon: Heart, gradient: 'from-pink-400 to-rose-400', label: 'お尻' },
                { id: 'arms', icon: Dumbbell, gradient: 'from-green-400 to-emerald-400', label: '二の腕' },
                { id: 'back', icon: Shield, gradient: 'from-indigo-400 to-blue-400', label: '背中' },
                { id: 'whole', icon: Sparkles, gradient: 'from-purple-400 to-pink-400', label: '全身' }
              ].map((area) => {
                const Icon = area.icon;
                return (
                  <Card 
                    key={area.id}
                    className={`cursor-pointer transition-all ${
                      formData.targetAreas.includes(area.id) 
                        ? 'bg-pink-100 border-pink-300 scale-105 shadow-lg' 
                        : 'bg-white border-pink-100 hover:bg-pink-50'
                    }`}
                    onClick={() => toggleArrayItem('targetAreas', area.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 mx-auto bg-gradient-to-br ${area.gradient} rounded-full flex items-center justify-center mb-2 shadow-md`}>
                        <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                      </div>
                      <span className="text-pink-800">{area.label}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center shadow-lg mb-4">
                <Calendar className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl text-pink-800 mb-2">週に何回運動したいですか？</h2>
              <p className="text-pink-600">無理のない回数で</p>
            </div>

            <div className="space-y-3">
              {[
                { id: '1', icon: Star, gradient: 'from-green-400 to-emerald-400', label: '1回', desc: 'ゆっくりペース' },
                { id: '2-3', icon: Zap, gradient: 'from-yellow-400 to-orange-400', label: '2〜3回', desc: 'バランス良く' },
                { id: '4+', icon: Trophy, gradient: 'from-red-400 to-pink-400', label: '4回以上', desc: 'しっかりと' }
              ].map((freq) => {
                const Icon = freq.icon;
                return (
                  <Card 
                    key={freq.id}
                    className={`cursor-pointer transition-all ${
                      formData.frequency === freq.id 
                        ? 'bg-pink-100 border-pink-300 scale-102 shadow-lg' 
                        : 'bg-white border-pink-100 hover:bg-pink-50'
                    }`}
                    onClick={() => updateFormData('frequency', freq.id)}
                  >
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${freq.gradient} rounded-full flex items-center justify-center shadow-md`}>
                        <Icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="text-pink-800 text-lg">{freq.label}</div>
                        <div className="text-pink-600 text-sm">{freq.desc}</div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center shadow-lg mb-4">
                <Calendar className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl text-pink-800 mb-2">どの曜日に運動しますか？</h2>
              <p className="text-pink-600">複数選択OK</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: '月', icon: Star, gradient: 'from-blue-400 to-indigo-400', label: '月曜日' },
                { id: '火', icon: Zap, gradient: 'from-red-400 to-orange-400', label: '火曜日' },
                { id: '水', icon: Heart, gradient: 'from-cyan-400 to-blue-400', label: '水曜日' },
                { id: '木', icon: Target, gradient: 'from-green-400 to-emerald-400', label: '木曜日' },
                { id: '金', icon: Crown, gradient: 'from-yellow-400 to-orange-400', label: '金曜日' },
                { id: '土', icon: Trophy, gradient: 'from-purple-400 to-pink-400', label: '土曜日' },
                { id: '日', icon: Sparkles, gradient: 'from-orange-400 to-red-400', label: '日曜日' }
              ].map((day) => {
                const Icon = day.icon;
                return (
                  <Card 
                    key={day.id}
                    className={`cursor-pointer transition-all ${
                      formData.schedule.includes(day.id) 
                        ? 'bg-pink-100 border-pink-300 scale-105 shadow-lg' 
                        : 'bg-white border-pink-100 hover:bg-pink-50'
                    }`}
                    onClick={() => toggleArrayItem('schedule', day.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`w-10 h-10 mx-auto bg-gradient-to-br ${day.gradient} rounded-full flex items-center justify-center mb-2 shadow-md`}>
                        <Icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                      </div>
                      <span className="text-pink-800 text-sm">{day.label}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-400 to-green-400 rounded-full flex items-center justify-center shadow-lg mb-4">
                <Timer className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl text-pink-800 mb-2">1回あたりの時間はどれくらい？</h2>
              <p className="text-pink-600">続けやすい時間で</p>
            </div>

            <div className="space-y-3">
              {[
                { id: '10', icon: Zap, gradient: 'from-yellow-400 to-orange-400', label: '10分', desc: 'サクッと短時間' },
                { id: '20-30', icon: Target, gradient: 'from-blue-400 to-purple-400', label: '20〜30分', desc: 'しっかり集中' },
                { id: '45+', icon: Trophy, gradient: 'from-red-400 to-pink-400', label: '45分以上', desc: 'がっつりトレーニング' }
              ].map((duration) => {
                const Icon = duration.icon;
                return (
                  <Card 
                    key={duration.id}
                    className={`cursor-pointer transition-all ${
                      formData.duration === duration.id 
                        ? 'bg-pink-100 border-pink-300 scale-102 shadow-lg' 
                        : 'bg-white border-pink-100 hover:bg-pink-50'
                    }`}
                    onClick={() => updateFormData('duration', duration.id)}
                  >
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${duration.gradient} rounded-full flex items-center justify-center shadow-md`}>
                        <Icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="text-pink-800 text-lg">{duration.label}</div>
                        <div className="text-pink-600 text-sm">{duration.desc}</div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-pink-400 via-rose-400 to-purple-400 rounded-full flex items-center justify-center shadow-lg mb-4">
                <Heart className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl text-pink-800 mb-2">一番のモチベーションは何ですか？</h2>
              <p className="text-pink-600">あなたの理想を教えて</p>
            </div>

            <div className="space-y-3">
              {[
                { id: 'mirror', icon: Eye, gradient: 'from-purple-400 to-pink-400', label: '鏡に映る自分', desc: '理想の体型になりたい' },
                { id: 'clothes', icon: Shirt, gradient: 'from-blue-400 to-purple-400', label: 'おしゃれな服を着たい', desc: '好きな服を着こなしたい' },
                { id: 'praise', icon: MessageCircle, gradient: 'from-pink-400 to-rose-400', label: '褒められたい', desc: '周りの人に認められたい' },
                { id: 'energy', icon: Battery, gradient: 'from-green-400 to-emerald-400', label: '体力をつけたい', desc: '元気に過ごしたい' }
              ].map((motivation) => {
                const Icon = motivation.icon;
                return (
                  <Card 
                    key={motivation.id}
                    className={`cursor-pointer transition-all ${
                      formData.motivation === motivation.id 
                        ? 'bg-pink-100 border-pink-300 scale-102 shadow-lg' 
                        : 'bg-white border-pink-100 hover:bg-pink-50'
                    }`}
                    onClick={() => updateFormData('motivation', motivation.id)}
                  >
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${motivation.gradient} rounded-full flex items-center justify-center shadow-md`}>
                        <Icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="text-pink-800 text-lg">{motivation.label}</div>
                        <div className="text-pink-600 text-sm">{motivation.desc}</div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

        case 9:
        return (
            <div className="space-y-8">
            <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center shadow-lg mb-4">
                <Scale className="w-10 h-10 text-white" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl text-pink-800 mb-2">現在の身長・体重は？</h2>
                <p className="text-pink-600">プラン作成の参考にします（任意入力でもOK）</p>
            </div>

            <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                <input
                    type="number"
                    value={formData.height || ""}
                    onChange={(e) => updateFormData('height', e.target.value)}
                    placeholder="160"
                    className="w-24 text-center border rounded-lg p-2 border-pink-200 focus:border-pink-400"
                />
                <span className="text-pink-800">cm</span>
                </div>

                <div className="flex items-center gap-2">
                <input
                    type="number"
                    value={formData.weight || ""}
                    onChange={(e) => updateFormData('weight', e.target.value)}
                    placeholder="55"
                    className="w-24 text-center border rounded-lg p-2 border-pink-200 focus:border-pink-400"
                />
                <span className="text-pink-800">kg</span>
                </div>
            </div>
            </div>
        );

      default:
        return (
          <div className="text-center space-y-8">
            <div className="relative">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-400 rounded-full flex items-center justify-center shadow-2xl mb-6">
                <Gift className="w-16 h-16 text-white" strokeWidth={1.5} />
              </div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
                <PartyPopper className="w-8 h-8 text-yellow-400 animate-bounce" />
              </div>
              <div className="absolute top-4 right-1/4">
                <Sparkles className="w-6 h-6 text-pink-400 animate-pulse" />
              </div>
              <div className="absolute top-4 left-1/4">
                <Star className="w-6 h-6 text-orange-400 animate-pulse delay-200" />
              </div>
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl text-pink-800 leading-relaxed">
                あなた専用のプランが<br />
                完成しました！
              </h2>
              <div className="bg-gradient-to-r from-pink-100 to-orange-100 p-6 rounded-2xl border border-pink-200 shadow-lg">
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <Star className="w-5 h-5 text-pink-500" />
                    <span className="text-pink-700 text-lg">理想の体づくりを始めましょう！</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="w-5 h-5 text-orange-500" />
                    <span className="text-pink-700 text-lg">あなたなら絶対できます！</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500" />
                    <span className="text-pink-700 text-lg">一緒に頑張りましょう！</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-4">
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" />
                <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce delay-100" />
                <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-25 to-orange-50 p-4 flex flex-col">
      {/* Progress indicator */}
      {step > 0 && step <= 9 && (
        <div className="max-w-md mx-auto w-full mb-6">
          <div className="flex justify-between text-sm text-pink-600 mb-2">
            <span>{step}/9</span>
            <span>{Math.round((step / 9) * 100)}%</span>
          </div>
          <div className="w-full bg-pink-100 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-pink-400 to-rose-400 h-3 rounded-full transition-all duration-500 relative overflow-hidden"
              style={{ width: `${(step / 9) * 100}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        {renderStep()}
      </div>

      <div className="mt-8 max-w-md mx-auto w-full">
        <Button
          onClick={handleNext}
          disabled={!canProceed()}
          className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white h-14 rounded-2xl text-lg shadow-lg transform transition-all duration-200 hover:scale-105 disabled:scale-100 disabled:opacity-50"
        >
          {step === 0 ? 'はじめる' : step === 9 ? 'トレーニングを始める' : '次へ'}
          <ChevronRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};